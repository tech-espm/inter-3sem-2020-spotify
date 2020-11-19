import { randomBytes } from "crypto";
import express = require("express");
import Sql = require("../infra/sql");
import Artista = require("./artista");
import Musica = require("./musica");
import SpotifyClient = require("./spotifyClient");

class Afinidade {
	public idusuario : number;
	public idusuario2 : number;
	public afinidade : number;

}

export = class Usuario {
	private static readonly NomeCookie = "usuarioSpotify";

	public idusuario: number;
	public idspotify: string;
	public nome: string;
	public email: string;
	public accessToken: string;
	public refreshToken: string;
	public validadeToken: number;
	public telefone: string;
	public criacao: string;

	public static async obterIdUsuario(idspotify: string): Promise<number> {
		let idusuario = 0;

		await Sql.conectar(async(sql) => {
			idusuario = await sql.scalar("SELECT idusuario FROM usuario WHERE idspotify = ?", [idspotify]);
		});

		return idusuario;
	}

	public static async cookie(req: express.Request): Promise<Usuario> {
		let cookieStr = req.cookies[Usuario.NomeCookie] as string;

		if (!cookieStr || cookieStr.length !== 40) {
			return null;
		} else {
			let idusuario = parseInt(cookieStr.substr(0, 8), 16);
			let usuario: Usuario = null;

			await Sql.conectar(async (sql: Sql) => {
				let rows = await sql.query("SELECT idusuario, idspotify, nome, email, token, accessToken, refreshToken, validadeToken FROM usuario WHERE idusuario = ?", [idusuario]);
				let row: any;

				if (!rows || !rows.length || !(row = rows[0]))
					return;

				let token = cookieStr.substring(8);

				if (!row.token || token !== (row.token as string))
					return;

				const agora = (((new Date()).getTime() / 1000) | 0);
				const delta = agora - row.validadeToken;
				if (delta >= 0)
					return;

				// Só atualiza se estiver sobrando menos de 30 minutos
				if (-delta < (30 * 60)) {
					const api = SpotifyClient.createApi(row.accessToken, row.refreshToken);
					const dadosNovos = await SpotifyClient.refreshAccessToken(api);
					if (dadosNovos) {
						if (dadosNovos.access_token)
							row.accessToken = dadosNovos.access_token;
						if (dadosNovos.refresh_token)
							row.refreshToken = dadosNovos.refresh_token;
						if (dadosNovos.expires_in)
							row.validadeToken = (((new Date()).getTime() / 1000) | 0) + parseInt(dadosNovos.expires_in);
						await sql.query("UPDATE usuario SET accessToken = ?, refreshToken = ?, validadeToken = ? WHERE idusuario = ?", [row.accessToken, row.refreshToken, row.validadeToken, idusuario]);
					}
				}

				let u = new Usuario();
				u.idusuario = idusuario;
				u.idspotify = row.idspotify;
				u.nome = row.nome;
				u.email = row.email;
				u.accessToken = row.accessToken;
				u.refreshToken = row.refreshToken;
				u.validadeToken = row.validadeToken;

				usuario = u;
			});

			return usuario;
		}
	}

	private static gerarTokenCookie(id: number): [string, string] {
		function intToHex(x: number): string {
			let s = "0000000" + x.toString(16);
			return s.substring(s.length - 8);
		}

		let idStr = intToHex(id);
		let token = randomBytes(16).toString("hex");
		let cookieStr = idStr + token;
		return [token, cookieStr];
	}

	public static async efetuarLogin(res: express.Response, code: string): Promise<Usuario> {
		let api = SpotifyClient.createApi();

		const data = await api.authorizationCodeGrant(code);

		const usuario = new Usuario();
		usuario.accessToken = data.body.access_token;
		usuario.refreshToken = data.body.refresh_token;
		usuario.validadeToken = (((new Date()).getTime() / 1000) | 0) + parseInt(data.body.expires_in);

		api = SpotifyClient.createApi(usuario.accessToken, usuario.refreshToken);

		const me = await api.getMe();

		usuario.idspotify = me.body.id;
		usuario.nome = me.body.display_name;
		usuario.email = me.body.email;

		usuario.idusuario = await Usuario.obterIdUsuario(usuario.idspotify);

		if (!usuario.idusuario) {
			await Usuario.inserir(usuario);
		} else {
			await Usuario.atualizar(usuario);
		}

		let [token, cookieStr] = Usuario.gerarTokenCookie(usuario.idusuario);

		await Sql.conectar(async(sql) => {
			await sql.query("UPDATE usuario set token = ? WHERE idusuario = ?", [token, usuario.idusuario]);
		});

		res.cookie(Usuario.NomeCookie, cookieStr, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: "/", secure: false });

		return usuario;
	}

	public static async obter(idspotify: string): Promise<Usuario> {
		let lista: Usuario[] = null;

		await Sql.conectar(async(sql) => {
			// @@@ Voltar quando o cookie estiver funcionando
			//lista = await sql.query("SELECT idusuario, idspotify, nome, email, accessToken, refreshToken, validadeToken FROM usuario WHERE idspotify = ?", [idspotify]);
			lista = await sql.query("SELECT idusuario, idspotify, nome, email, accessToken, refreshToken, validadeToken FROM usuario limit 1");
		});

		if (lista && lista[0])
			return lista[0];

		return null;
	}
	public static async inserir(usuario: Usuario): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("INSERT INTO usuario (idspotify, nome, email, accessToken, refreshToken, validadeToken, criacao) VALUES (?, ?, ?, ?, ?, ?, now())", [usuario.idspotify, usuario.nome, usuario.email, usuario.accessToken, usuario.refreshToken, usuario.validadeToken]);
			usuario.idusuario = await sql.scalar("SELECT last_insert_id()");
		});
	}

	public static async atualizar(usuario: Usuario): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("UPDATE usuario SET nome = ?, email = ?, accessToken = ?, refreshToken = ?, validadeToken = ? WHERE idspotify = ?", [usuario.nome, usuario.email, usuario.accessToken, usuario.refreshToken, usuario.validadeToken, usuario.idspotify]);
		});
	}

	public static async deletar(usuario:Usuario): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("DELETE FROM usuario WHERE idspotify = ?", [usuario.idspotify]);
		});
	}

	public static async afinidade(usuario:Usuario): Promise<Afinidade[]> {
		let lista: number[];
		let res : Afinidade[];	
		let musicas: Musica[] = await Musica.listar(usuario.idusuario);
		let artistas: Artista[] = await Artista.listar(usuario.idusuario);
		let cont = 0;
		
		await Sql.conectar(async(sql) =>{
			if(lista){
				lista = await sql.query("SELECT idusuario FROM usuario");
				for(let i=0;i<lista.length;i++){
					if(i==usuario.idusuario){
						i++;
						break;
					}
					let musicas_comparar: Musica[] = await Musica.listar(i);
					let artistas_comparar: Artista[] = await Artista.listar(i);
					for(let j=0;j<musicas.length;j++){
						for(let x=0;x<musicas_comparar.length;x++){
							if(musicas[j]===musicas_comparar[x]){
								cont = cont + 1;
							}
							if(artistas[j]===artistas_comparar[x]){
								cont = cont + 1;
							}
						}
					}
					await sql.query("INSERT INTO afinidade VALUES(?,?,?)"[usuario.idusuario,i,cont]);
					
				}
				res = await sql.query("SELECT afinidade FROM afinidade where idusuario = ?"[usuario.idusuario]);
				
		    }
		});
		return res;

	}
}
