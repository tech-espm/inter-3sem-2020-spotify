"use strict";
const Sql = require("../infra/sql");
const api = require("../app");
const info = api.getMe();
console.log(info.body.display_name);
module.exports = class Usuario {
    static async listarTodos() {
        let lista;
        await Sql.conectar(async (sql) => {
            lista = await sql.query("SELECT id,nome,email FROM usuario ORDER BY nome");
        });
        return lista;
    }
    static async inserir(usuario) {
        await Sql.conectar(async (sql) => {
            await sql.query("INSERT INTO usuario(nome,email) VALUES (?,?)", [usuario.nome, usuario.email]);
        });
    }
};
//# sourceMappingURL=usuario.js.map