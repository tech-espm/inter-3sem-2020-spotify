import Sql = require("../infra/sql");
import SpotifyClient = require("./spotifyClient");

let api = SpotifyClient.createApi();

const artists =  api.getMyTopArtists({
    limit: 10,
    offset: 0,
    time_range: "medium_term"
});

export = class Artista {
    public idartista: number;
    public idspotify: String;
    public nome: String;

    public static async inserir(artista:Artista): Promise<void>{
        await Sql.conectar(async (sql)=>{
            await sql.query("INSERT INTO artista(idspotify,nome) VALUES (?,?)",[artista.idspotify, artista.nome]);
        })
    }  

    public static async obter(idspotify: String): Promise<Artista> {
		let lista: Array<Artista> = null;

		await Sql.conectar(async(sql) => {
			lista = await sql.query("SELECT idspotify,nome FROM artista WHERE idspotify = ?", [idspotify])
		});

		return lista[0];
    }

    public static async deletar(artista:Artista): Promise<void> {
		await Sql.conectar(async (sql)=>{
			await sql.query("DELETE FROM artista WHERE idspotify = ?", [artista.idspotify]);
		});
	}



}

