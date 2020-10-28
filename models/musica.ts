import Sql = require("../infra/sql");
import SpotifyWebApi = require("spotify-web-api-node");
import app = require("../app");
import Usuario = require("./usuario");
/*

const tracks =  app.ap().getMyTopTracks({
    limit: 10,
    offset: 0,
    time_range: "medium_term"
    });

const toptracks :Array <String> = [];
	for (let i = 0;i<10;i++){
		toptracks.push(tracks.body.items[i].id);
		}
*/
/*export = class Musicas {
    public musicas: Array<String> = toptracks;

    public static async inserir(usuario:Usuario,musicas:Array<String>): Promise<void>{
        await Sql.conectar(async (sql)=>{
            await sql.query("INSERT INTO musicas(idspotify) VALUES (?,?)",[id]);
        })
    }
}*/
