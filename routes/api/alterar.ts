import Usuario = require("../../models/usuario");
import express = require("express");
import wrap = require("express-async-error-wrapper");

const router = express.Router();

router.post("/profile",wrap(async(req: express.Request, res: express.Response) => {
    const usuario = await Usuario.cookie(req);
    if(req.body.nome){
    usuario.nome = req.body.nome;
    }
    if(req.body.email){
    usuario.email = req.body.email;
    }
    usuario.telefone = req.body.telefone;

    const u = await Usuario.obter(usuario.idspotify);
    usuario.imagem = u.imagem;
    usuario.url = u.url;
    await Usuario.atualizar(usuario);
}));

export = router;
