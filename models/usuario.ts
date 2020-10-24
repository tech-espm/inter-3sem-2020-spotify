import Sql = require("../infra/sql");
import SpotifyWebApi = require("spotify-web-api-node");
import app = require("../app");

const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const redirectUri = "http://localhost:1337/callback";


const info = app.ap().getMe();


export = class Usuario {
    public idspotify : string = info.body.id;
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

    public static async obter(id:String): Promise<Usuario[]>{
        let user: Usuario[] = null;
        await Sql.conectar(async(sql) => {
            user = await sql.query("SELECT id,nome,email FROM usuario WHERE id=?",[id]);
        });
        return user;
    }

    public static async inserir(usuario:Usuario): Promise<void>{
        await Sql.conectar(async (sql)=>{
            await sql.query("INSERT INTO usuario(id,nome,email) VALUES (?,?,?)",[usuario.idspotify,usuario.nome,usuario.email]);
        })
    }
    public static async atualizar(usuario:Usuario): Promise<void>{
        await Sql.conectar(async (sql)=>{
            await sql.query("UPDATE usuario SET nome=?,email=? WHERE id=?",[usuario.nome,usuario.email,usuario.idspotify]);
        })
    }
    public static async deletar(usuario:Usuario): Promise<void>{
        await Sql.conectar(async(sql)=>{
            await sql.query("DELETE FROM usuario WHERE id=?",[usuario.idspotify]);
        })
    }
}