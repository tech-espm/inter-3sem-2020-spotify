import Sql = require("../infra/sql");
import SpotifyClient = require("./spotifyClient");

let api = SpotifyClient.createApi();

const tracks = api.getMyTopTracks({
    limit: 50,
    offset: 0,
    time_range: "medium_term"
    });

export = class Musicas {
    public idmusica: String;
    public idspotify : String;
    public nome : String;
    public idalbum : String;
    public nomealbum : String;

    public static async inserir(musicas:Musicas): Promise<void>{
        await Sql.conectar(async (sql)=>{
            await sql.query("INSERT INTO musicas(idspotify,nome,idalbum,nomealbum) VALUES (?,?,?,?)",[musicas.idspotify, musicas.nome, musicas.idalbum, musicas.nomealbum]);
        })
    }

    public static async obter(idspotify: String): Promise<Musicas> {
		let lista: Array<Musicas> = null;

		await Sql.conectar(async(sql) => {
			lista = await sql.query("SELECT idspotify,nome,idalbum,nomealbum FROM musicas WHERE idspotify = ?", [idspotify])
		});

		return lista[0];
    }
    
	public static async deletar(musica:Musicas): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("DELETE FROM musica WHERE idspotify = ?", [musica.idspotify]);
		});
	}


}
