import Usuario = require("../../models/usuario");
import express = require("express");
import cookieParser = require("cookie-parser");
import wrap = require("express-async-error-wrapper");

const router = express.Router();

router.post("/profile",wrap(async(req: express.Request, res: express.Response) => {
	const usuario = await Usuario.cookie(req);
    usuario.nome = req.body.nome;
    usuario.email = req.body.email;
    usuario.telefone = req.body.telefone;
    if(usuario.nome || usuario.email){
    await Usuario.atualizar(usuario);
    res.send("Alterado");
    }
	
}));

export = router;
