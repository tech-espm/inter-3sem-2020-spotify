import Sql = require("../infra/sql");
import api = require("../app");

const info = api.getMe();


export = class Usuario {
    public idspotify : number = info.body.id;
    public nome : string = info.body.display_name;
    public email : string = info.body.email;

    public static async listarTodos(): Promise<Usuario[]>{
        let lista: Usuario[];

        await Sql.conectar(async(sql) => {
            lista = await sql.query("SELECT id,nome,email FROM usuario ORDER BY nome");
        }

        );
        return lista;
    }

    public static async inserir(usuario:Usuario): Promise<void>{
        await Sql.conectar(async (sql)=>{
            await sql.query("INSERT INTO usuario(id,nome,email) VALUES (?,?,?)",[usuario.idspotify,usuario.nome,usuario.email]);
        })
    }
}