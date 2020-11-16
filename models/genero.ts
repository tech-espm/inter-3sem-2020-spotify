import Sql = require("../infra/sql");

class ArtistaGenero {
    public idartista_genero : number;
    public idartista : number;
    public idgenero : number
}


export = class Genero {
    public idgenero: number;
    public nome: string;

    public static async genero(idspotify:string,generos: Genero[]): Promise<void> {
        await Sql.conectar(async (sql) => {
            let generosNovos: ArtistaGenero[] = [];
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
                    
                    const generoNovo = new ArtistaGenero();
                    generoNovo.idartista = idartista;
                    generoNovo.idgenero = idgenero;
                    generosNovos.push(generoNovo);
                }
                let generosExistentes = await sql.query("select idartista_genero, idartista, idgenero from artista_genero where idartista = ?", [idartista]) as ArtistaGenero[];
                if (!generosExistentes)
                    generosExistentes = [];
    
                let generosParaExcluir: ArtistaGenero[] = [];

                for (let i = generosExistentes.length - 1; i >= 0; i--) {
                    const generoExistente = generosExistentes[i];
                    let estaPresenteNaNovaLista = false;
    
                    for (let j = 0; j < generosNovos.length; j++) {
                        if (generoExistente.idgenero === generosNovos[j].idgenero) {
                            estaPresenteNaNovaLista = true;
                            generosNovos.splice(j, 1);
                            break;
                        }
                    }
    
                    if (!estaPresenteNaNovaLista) {
                        generosParaExcluir.push(generoExistente);
                        generosExistentes.splice(i, 1);
                    }
                }

                await sql.beginTransaction();

                for (let i = 0; i < generosParaExcluir.length; i++) {
                    await sql.query("delete from musica_mais_tocada where idmusica_mais_tocada = ?", [generosParaExcluir[i].idartista_genero]);
                }
                for (let i = 0; i < generosNovos.length; i++) {
                    await sql.query("insert into musica_mais_tocada (idusuario, idmusica, ordem) values (?, ?, ?)", [generosNovos[i].idartista, generosNovos[i].idgenero]);
                }
    
                await sql.commit();

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
