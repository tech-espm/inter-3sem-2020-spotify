import Sql = require("../infra/sql");

export = class Usuario {
	public idusuario: number;
	public idspotify: string;
	public nome: string;
	public email: string;
	public accessToken: string;
	public refreshToken: string;
	public telefone: string;
	public criacao: string;

	public static async obterIdUsuario(idspotify: string): Promise<number> {
		let idusuario = 0;

		await Sql.conectar(async(sql) => {
			idusuario = await sql.scalar("SELECT idusuario FROM usuario WHERE idspotify = ?", [idspotify]);
		});

		return idusuario;
	}

	public static async obter(idspotify: string): Promise<Usuario> {
		let lista: Usuario[] = null;

		await Sql.conectar(async(sql) => {
			// @@@ Voltar quando o cookie estiver funcionando
			//lista = await sql.query("SELECT idusuario, idspotify, nome, email, accessToken, refreshToken FROM usuario WHERE idspotify = ?", [idspotify]);
			lista = await sql.query("SELECT idusuario, idspotify, nome, email, accessToken, refreshToken FROM usuario limit 1");
		});

		if (lista && lista[0])
			return lista[0];

		return null;
	}

	public static async inserir(usuario: Usuario): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("INSERT INTO usuario (idspotify, nome, email, accessToken, refreshToken, criacao) VALUES (?, ?, ?, ?, ?, now())", [usuario.idspotify, usuario.nome, usuario.email, usuario.accessToken, usuario.refreshToken]);
		});
	}

	public static async atualizar(usuario: Usuario): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("UPDATE usuario SET nome = ?, email = ?, accessToken = ?, refreshToken = ? WHERE idspotify = ?", [usuario.nome, usuario.email, usuario.accessToken, usuario.refreshToken, usuario.idspotify]);
		});
	}

	public static async deletar(usuario:Usuario): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("DELETE FROM usuario WHERE idspotify = ?", [usuario.idspotify]);
		});
	}
}
