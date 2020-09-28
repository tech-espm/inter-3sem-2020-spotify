import Sql = require("../infra/sql");
import api = require("../app");

const info = api.getMe();


export = class Usuario {
    public id : number;
    public nome : string = info.body.display_name;
    public email : string;

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
            await sql.query("INSERT INTO usuario(nome,email) VALUES (?,?)",[usuario.nome,usuario.email]);
        })
    }
}