import Sql = require("../infra/sql");
import SpotifyClient = require("./spotifyClient");

class MusicaMaisTocada {
    public idmusica_mais_tocada: number;
    public idusuario: number;
    public idmusica: number;
    public ordem: number;
}

export = class Musica {
    public idmusica: number;
    public idspotify: string;
    public nome: string;
    public idalbum: string;
    public nomealbum: string;

    public static async merge(idusuario: number, musicas: Musica[]): Promise<void> {
        await Sql.conectar(async (sql) => {
            let musicasNovas: MusicaMaisTocada[] = [];

            // Insere as músicas faltantes no banco (independe do usuário)
            for (let i = 0; i < musicas.length; i++) {
                let idmusica = await sql.scalar("select idmusica from musica where idspotify = ?", [musicas[i].idspotify]) as number;
                if (!idmusica) {
                    await sql.query("insert into musica (idspotify, nome, idalbum, nomealbum) values (?, ?, ?, ?)", [musicas[i].idspotify, musicas[i].nome, musicas[i].idalbum, musicas[i].nomealbum]);
                    idmusica = await sql.scalar("select last_insert_id()");
                }
                musicas[i].idmusica = idmusica;

                const musicaNova = new MusicaMaisTocada();
                musicaNova.idusuario = idusuario;
                musicaNova.idmusica = idmusica;
                musicaNova.ordem = i;
                musicasNovas.push(musicaNova);
            }

            let musicasExistentes = await sql.query("select idmusica_mais_tocada, idusuario, idmusica, ordem from musica_mais_tocada where idusuario = ?", [idusuario]) as MusicaMaisTocada[];
            if (!musicasExistentes)
                musicasExistentes = [];

            let musicasParaExcluir: MusicaMaisTocada[] = [];

            for (let i = musicasExistentes.length - 1; i >= 0; i--) {
                const musicaExistente = musicasExistentes[i];
                let estaPresenteNaNovaLista = false;

                // Procura a música existente na lista de músicas novas. Caso
                // a música existente esteja na lista de músicas novas, então
                // removemos da lista de músicas novas (porque ela não é "nova"
                // de verdade). Caso a música existente não esteja na lista de
                // músicas novas, então significa que essa música existente já
                // não é mais uma das top músicas desse usuário, e ela deve ser
                // removida do banco.
                for (let j = 0; j < musicasNovas.length; j++) {
                    if (musicaExistente.idmusica === musicasNovas[j].idmusica) {
                        estaPresenteNaNovaLista = true;
                        musicaExistente.ordem = musicasNovas[j].ordem;
                        musicasNovas.splice(j, 1);
                        break;
                    }
                }

                if (!estaPresenteNaNovaLista) {
                    musicasParaExcluir.push(musicaExistente);
                    musicasExistentes.splice(i, 1);
                }
            }

            await sql.beginTransaction();

            for (let i = 0; i < musicasParaExcluir.length; i++) {
                await sql.query("delete from musica_mais_tocada where idmusica_mais_tocada = ?", [musicasParaExcluir[i].idmusica_mais_tocada]);
            }

            for (let i = 0; i < musicasExistentes.length; i++) {
                await sql.query("update musica_mais_tocada set ordem = ? where idmusica_mais_tocada = ?", [musicasExistentes[i].ordem, musicasExistentes[i].idmusica_mais_tocada]);
            }

            for (let i = 0; i < musicasNovas.length; i++) {
                await sql.query("insert into musica_mais_tocada (idusuario, idmusica, ordem) values (?, ?, ?)", [musicasNovas[i].idusuario, musicasNovas[i].idmusica, musicasNovas[i].ordem]);
            }

            await sql.commit();
        });
    }

    public static async listar(idusuario: number): Promise<Musica[]> {
        let lista: Musica[] = null;

        await Sql.conectar(async (sql) => {
            lista = await sql.query("select m.idmusica, m.idspotify, m.nome, m.idalbum, m.nomealbum from musica_mais_tocada mt inner join musica m on m.idmusica = mt.idmusica where mt.idusuario = ? order by mt.ordem", [idusuario]);
        });

        return lista || [];
    }
}
