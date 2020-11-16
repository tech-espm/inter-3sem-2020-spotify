import Sql = require("../infra/sql");


export = class Genero {
    public idgenero: number;
    public nome: string;

    public static async genero(idspotify:string,generos: Genero[]): Promise<void> {
        await Sql.conectar(async (sql) => {
            //Pegar idartista pelo idspotify            
            let idartista = await sql.scalar("select idartista from artista where idspotify = ?", [idspotify]) as number;

            //Inserir cada genero da lista se ja existir pega o idgenero
            if (idartista) {
                for (let i = 0; i < generos.length; i++) {
                    let idgenero = await sql.scalar("select idgenero from genero where nome = ?", [generos[i].nome]) as number;
                    if (!idgenero) {
                        await sql.query("insert into genero (nome) values (?)", [generos[i].nome]);
                        idgenero = await sql.scalar("select last_insert_id()");
                    }
                    generos[i].idgenero = idgenero;
                    //Inserir idartista e idgenero em artista_genero
                    await sql.query("insert into artista_genero (idartista, idgenero) values (?, ?)", [idartista,idgenero]);
                }
            }
            
        });
    }
    
    public static async listar(idspotify: number): Promise<Genero[]> {
        
        let lista: Genero[] = null;

        await Sql.conectar(async (sql) => {
            let idartista = await sql.scalar("select idartista from artista where idspotify = ?", [idspotify]) as number;
            lista = await sql.query("select g.idgenero, g.nome, ag.idartista, a.nome from artista_genero ag inner join genero g on g.idgenero = ag.idgenero inner join artista a on a.idartista = ag.idartista where ag.idartista = ?", [idartista]);
        });

        return lista || [];
    }

}
