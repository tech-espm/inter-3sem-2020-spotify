import { randomBytes } from "crypto";
import express = require("express");
import Sql = require("../infra/sql");
import Artista = require("./artista");
import Musica = require("./musica");
import SpotifyClient = require("./spotifyClient");

class Afinidade {
	public idusuario2 : number;
	public nome : string;
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
			await sql.query("UPDATE usuario SET nome = ?, email = ?, telefone = ?, accessToken = ?, refreshToken = ?, validadeToken = ? WHERE idusuario = ?", [usuario.nome, usuario.email, usuario.telefone, usuario.accessToken, usuario.refreshToken, usuario.validadeToken, usuario.idusuario]);
		});
	}

	public static async deletar(usuario:Usuario): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("DELETE FROM usuario WHERE idusuario = ?", [usuario.idusuario]);
		});
	}

	public static async afinidade(usuario:Usuario): Promise<Afinidade[]> {
		let lista: Afinidade[] = null;

		await Sql.conectar(async(sql) => {
			const id = await sql.scalar("SELECT idusuario FROM usuario where idusuario = ? and dataAfinidade >= adddate(now(), -7)", [usuario.idusuario]) as number;

			if (!id) {
				// Hora de gerar a afinidade de novo
				await sql.query("delete from afinidade where idusuario = ?", [usuario.idusuario]);
				await sql.query(`insert into afinidade (idusuario, idusuario2, afinidade)
					select ?, mmt2.idusuario, count(*) afinidade
					from musica_mais_tocada mmt
					inner join musica_mais_tocada mmt2 on mmt2.idmusica = mmt.idmusica
					where mmt.idusuario = ?
					group by mmt2.idusuario
					order by afinidade desc
					limit 10`, [usuario.idusuario, usuario.idusuario]);
				await sql.query("update usuario set dataAfinidade = now() where idusuario = ?", [usuario.idusuario]);
			}

			//lista = await sql.query(`select a.idusuario2, u.nome, a.afinidade
			//	from afinidade a
			//	inner join usuario u on u.idusuario = a.idusuario2
			//	where a.idusuario = ? and a.idusuario2 <> ?
			//	order by a.afinidade desc, u.nome asc`, [usuario.idusuario, usuario.idusuario]);
			lista = await sql.query(`select a.idusuario2, u.nome, a.afinidade
				from afinidade a
				inner join usuario u on u.idusuario = a.idusuario2
				where a.idusuario = ?`, [usuario.idusuario]);
			for (let i = lista.length - 1; i >= 0; i--) {
				if (lista[i].idusuario2 === usuario.idusuario) {
					lista.splice(i, 1); // Remove o elemento i da lista
					break;
				}
			}
			lista.sort((a, b) => {
				if (a.afinidade === b.afinidade)
					return (a.nome < b.nome ? -1 : 1); // Ordena pelo nome em ordem crescente, em caso de empate da afinidade
				return b.afinidade - a.afinidade; // Ordena pela afinidade em ordem decrescente
			});
		});

		return lista;
	}
}
