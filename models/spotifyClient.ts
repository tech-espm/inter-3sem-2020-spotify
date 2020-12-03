import Sql = require("../infra/sql");
import SpotifyWebApi = require("spotify-web-api-node");

require('dotenv').config();

export = class SpotifyClient {
	public static readonly scopes = ["user-read-private", "user-read-email", "user-top-read"];
	public static readonly clientId = "bdd9d114e3f64373b0a19b5c5cc5c7ed";
	public static readonly clientSecret = "b4e2b9a3e667482fac5d3fd52716f258";
	public static readonly redirectUri = "http://localhost:1337/callback";
	
	public static createApi(accessToken: string = null, refreshToken: string = null): SpotifyWebApi {
		const api = new SpotifyWebApi({
			clientId: SpotifyClient.clientId,
			clientSecret: SpotifyClient.clientSecret,
			redirectUri: SpotifyClient.redirectUri
		});
	
		if (accessToken)
			api.setAccessToken(accessToken);
	
		if (refreshToken)
			api.setRefreshToken(refreshToken);
	
		return api;
	}

	public static async refreshAccessToken(api: SpotifyWebApi): Promise<any> {
		return new Promise((resolve, reject) => {
			api.refreshAccessToken().then(
				(data: any) => {
					resolve(data.body);
				},
				(error: any) => {
					console.log("Could not refresh the token!", error.message);
					resolve(null);
				}
			);
		});
	}
}
