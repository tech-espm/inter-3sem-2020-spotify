import express = require("express");
import cookieParser = require("cookie-parser");
import wrap = require("express-async-error-wrapper");
import ejs = require("ejs");
import path = require("path");
import lru = require("lru-cache");
import SpotifyClient = require("./models/spotifyClient");
import Musica = require("./models/musica");
import Artista = require("./models/artista")
import Usuario = require("./models/usuario");
import Genero = require("./models/genero");

const app = express();

//views e cache
app.set("views", path.join(__dirname, "/views"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public"), {
	cacheControl: true,
	etag: false,
	maxAge: "30d"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
ejs.cache = lru(200);
app.set("view engine", "ejs");
app.use(require("express-ejs-layouts"));
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
	res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
	res.header("Expires", "-1");
	res.header("Pragma", "no-cache");
	next();
});

app.get("/login",(req: express.Request, res: express.Response) => {

	const api = SpotifyClient.createApi();

	// Create the authorization URL
	const authorizeURL = api.createAuthorizeURL(SpotifyClient.scopes, "");

	// https://accounts.spotify.com:443/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-private%20user-read-email&state=some-state-of-my-choice
	res.json(authorizeURL);

});

app.get("/callback", wrap(async (req: express.Request, res: express.Response) => {

	const code = req.query["code"] as string;

	const usuario = await Usuario.efetuarLogin(res, code);

	res.json("Código recebido: " + code);

}));

app.get("/tracks", wrap(async (req: express.Request, res: express.Response) => {

	try {
		const usuario = await Usuario.cookie(req);

		if (!usuario) {
			res.status(400).json("Usuário não encontrado");
			return;
		}

		// https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
		const api = SpotifyClient.createApi(usuario.accessToken, usuario.refreshToken);

		const response = await api.getMyTopTracks({
			limit: 10,
			offset: 0,
			time_range: "medium_term"
		});

		if (response.body && response.body.items) {
			let toptracks: Musica[] = [];

			for (let i = 0; i < response.body.items.length; i++) {
				const track = response.body.items[i];

				const musica = new Musica();
				musica.idmusica = 0;
				musica.idspotify = track.id;
				musica.nome = track.name;
				if (track.album) {
					musica.idalbum = track.album.id;
					musica.nomealbum = track.album.name;
					toptracks.push(musica);
				}
			}

			await Musica.merge(usuario.idusuario, toptracks);
		}

		res.json(await Musica.listar(usuario.idusuario));

	} catch (ex) {
		res.status(500).json("Erro: " + ex);
	}

}));

app.get("/artists", wrap(async (req: express.Request, res: express.Response) => {

	try {
		const usuario = await Usuario.cookie(req);

		if (!usuario) {
			res.status(400).json("Usuário não encontrado");
			return;
		}

		// https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
		const api = SpotifyClient.createApi(usuario.accessToken, usuario.refreshToken);

		const response = await api.getMyTopArtists({
			limit: 10,
			offset: 0,
			time_range: "medium_term"
		});

		if (response.body && response.body.items) {
			let topartists: Artista[] = [];

			for (let i = 0; i < response.body.items.length; i++) {
				const artist = response.body.items[i];

				const artista = new Artista();
				artista.idartista = 0;
				artista.idspotify = artist.id;
				artista.nome = artist.name;
				topartists.push(artista);
				
			}

			await Artista.merge(usuario.idusuario, topartists);
		}

		res.json(await Artista.listar(usuario.idusuario));
	} catch (ex) {
		res.status(500).json("Erro: " + ex);
	}

}));

app.get("/genres", wrap(async (req: express.Request, res: express.Response) => {
	try {
		const usuario = await Usuario.cookie(req);

		if (!usuario) {
			res.status(400).json("Usuário não encontrado");
			return;
		}

		// https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
		const api = SpotifyClient.createApi(usuario.accessToken, usuario.refreshToken);
		const response = await api.getMyTopArtists({
			limit: 10,
			offset: 0,
			time_range: "medium_term"
		});
		let lista = [];
		let genres: Genero[] = [];
		if (response.body && response.body.items) {
			let idspotify: string = "";
		for(let i = 0; i < response.body.items.length; i++){
			const artist = response.body.items[i];
			let idspotify = artist.id;

			for(let j = 0;j<artist.genres.length;j++){
				const genero = new Genero();
				genero.idgenero = 0;
				genero.nome = artist.genres[j];
				genres.push(genero);
			}
			lista.push(await Genero.listar(idspotify))
			await Genero.genero(idspotify,genres);
		}
		
	}
		res.json(genres);
	}
	catch (ex) {
		res.status(500).json("Erro: " + ex);
	}
}));


app.get("/", (req: express.Request, res: express.Response) => {

	res.render("index");

});

// >= 1024 && <= 65535 (0xFFFF - 16 bits)
app.listen(1337, () => {
	console.log("Executando servidor");
});

