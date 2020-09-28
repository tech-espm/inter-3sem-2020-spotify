"use strict";
const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const wrap = require("express-async-error-wrapper");
const ejs = require("ejs");
const path = require("path");
const lru = require("lru-cache");
require('dotenv').config();
const scopes = ["user-read-private", "user-read-email", "user-top-read"];
const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const redirectUri = "http://localhost:1337/callback";
const app = express();
//views e cache
app.set("views", path.join(__dirname, "/views"));
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
app.use((req, res, next) => {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    next();
});
// @@@
let accessToken = "";
let refreshToken = "";
function createApi(accessToken = null, refreshToken = null) {
    const api = new SpotifyWebApi({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: redirectUri
    });
    if (accessToken)
        api.setAccessToken(accessToken);
    if (refreshToken)
        api.setRefreshToken(refreshToken);
    return api;
}
app.get("/login", (req, res) => {
    const api = createApi();
    // Create the authorization URL
    const authorizeURL = api.createAuthorizeURL(scopes, "");
    // https://accounts.spotify.com:443/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-private%20user-read-email&state=some-state-of-my-choice
    res.json(authorizeURL);
});
app.get("/callback", wrap(async (req, res) => {
    const code = req.query["code"];
    const api = createApi();
    const data = await api.authorizationCodeGrant(code);
    console.log('The token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);
    console.log('The refresh token is ' + data.body['refresh_token']);
    accessToken = data.body['access_token'];
    refreshToken = data.body['refresh_token'];
    res.json("Código recebido: " + code);
}));
app.get("/info", wrap(async (req, res) => {
    try {
        //https://developer.spotify.com/documentation/web-api/reference/users-profile/get-current-users-profile/
        const api = createApi(accessToken, refreshToken);
        const info = await api.getMe();
        let user = [];
        user.push(info.body.display_name);
        user.push(info.body.email);
        user.push(info.body.external_urls.spotify);
        user.push(info.body.id);
        res.json(info);
    }
    catch (ex) {
        res.json("Erro: " + ex);
    }
}));
app.get("/tracks", wrap(async (req, res) => {
    try {
        // https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
        const api = createApi(accessToken, refreshToken);
        const tracks = await api.getMyTopTracks({
            limit: 10,
            offset: 0,
            time_range: "medium_term"
        });
        let toptracks = [];
        for (let i = 0; i < 10; i++) {
            toptracks.push(tracks.body.items[i].name);
        }
        res.json(tracks);
    }
    catch (ex) {
        res.json("Erro: " + ex);
    }
}));
app.get("/artists", wrap(async (req, res) => {
    try {
        // https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
        const api = createApi(accessToken, refreshToken);
        const artists = await api.getMyTopArtists({
            limit: 10,
            offset: 0,
            time_range: "medium_term"
        });
        let topartists = [];
        for (let i = 0; i < 10; i++) {
            topartists.push(artists.body.items[i].name);
        }
        res.json(artists);
    }
    catch (ex) {
        res.json("Erro: " + ex);
    }
}));
app.get("/", (req, res) => {
    res.render("index");
});
// >= 1024 && <= 65535 (0xFFFF - 16 bits)
app.listen(1337, () => {
    console.log("Executando servidor");
});
module.exports = createApi();
//# sourceMappingURL=app.js.map