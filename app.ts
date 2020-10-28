import express = require("express");
import cookieParser = require("cookie-parser");
import wrap = require("express-async-error-wrapper");
import ejs = require("ejs");
import path = require("path");
import lru = require("lru-cache");
import SpotifyClient = require("./models/spotifyClient");
import Usuario = require("./models/usuario");

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

		const tracks = await api.getMyTopTracks({
			limit: 10,
			offset: 0,
			time_range: "medium_term"
		});

		let toptracks :Array <String> = [];

		for (let i = 0;i<10;i++){
			toptracks.push(tracks.body.items[i].name);
		}		

		res.json(tracks);
		
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

		const artists = await api.getMyTopArtists({
			limit: 10,
			offset: 0,
			time_range: "medium_term"
		});

		let topartists :Array<String> = [];
		for (let i = 0;i<10;i++){
			topartists.push(artists.body.items[i].name);
		}	
		res.json(artists);
	} catch (ex) {
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

