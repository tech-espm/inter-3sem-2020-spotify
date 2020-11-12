import Sql = require("../infra/sql");
import SpotifyClient = require("./spotifyClient");

class ArtistaMaisTocado {
  public idartista_mais_tocado: number;
  public idusuario: number;
  public idartista: number;
  public ordem: number;

}

export = class Artista {
    public idartista: number;
    public idspotify: String;
    public nome: String;
  
      public static async merge(idusuario: number, artistas: Artista[]): Promise<void> {
          await Sql.conectar(async (sql) => {
              let artistasNovos: ArtistaMaisTocado[] = [];

              for (let i = 0; i < artistas.length; i++) {
                  let idartista = await sql.scalar("select idartista from artista where idspotify = ?", [artistas[i].idspotify]) as number;
                  if (!idartista) {
                      await sql.query("insert into artista (idspotify, nome) values (?, ?)", [artistas[i].idspotify, artistas[i].nome]);
                      idartista = await sql.scalar("select last_insert_id()");
                  }
                  artistas[i].idartista = idartista;
  
                  const artistaNovo = new ArtistaMaisTocado();
                  artistaNovo.idusuario = idusuario;
                  artistaNovo.idartista = idartista;
                  artistaNovo.ordem = i;
                  artistasNovos.push(artistaNovo);
              }
  
              let artistasExistentes = await sql.query("select idartista_mais_tocado, idusuario, idartista, ordem from artista_mais_tocado where idusuario = ?", [idusuario]) as ArtistaMaisTocado[];
              if (!artistasExistentes)
                  artistasExistentes = [];
  
              let artistasParaExcluir: ArtistaMaisTocado[] = [];
  
              for (let i = artistasExistentes.length - 1; i >= 0; i--) {
                  const artistaExistente = artistasExistentes[i];
                  let estaPresenteNaNovaLista = false;
  
                  for (let j = 0; j < artistasNovos.length; j++) {
                      if (artistaExistente.idartista === artistasNovos[j].idartista) {
                          estaPresenteNaNovaLista = true;
                          artistaExistente.ordem = artistasNovos[j].ordem;
                          artistasNovos.splice(j, 1);
                          break;
                      }
                  }
  
                  if (!estaPresenteNaNovaLista) {
                      artistasParaExcluir.push(artistaExistente);
                      artistasExistentes.splice(i, 1);
                  }
              }
  
              await sql.beginTransaction();
  
              for (let i = 0; i < artistasParaExcluir.length; i++) {
                  await sql.query("delete from artista_mais_tocado where idartista_mais_tocado = ?", [artistasParaExcluir[i].idartista_mais_tocado]);
              }
  
              for (let i = 0; i < artistasExistentes.length; i++) {
                  await sql.query("update artista_mais_tocado set ordem = ? where idartista_mais_tocado = ?", [artistasExistentes[i].ordem, artistasExistentes[i].idartista_mais_tocado]);
              }
  
              for (let i = 0; i < artistasNovos.length; i++) {
                  await sql.query("insert into artista_mais_tocado (idusuario, idartista, ordem) values (?, ?, ?)", [artistasNovos[i].idusuario, artistasNovos[i].idartista, artistasNovos[i].ordem]);
              }
  
              await sql.commit();
          });
      }
  
      public static async listar(idusuario: number): Promise<Artista[]> {
          let lista: Artista[] = null;
  
          await Sql.conectar(async (sql) => {
              lista = await sql.query("select a.idartista, a.idspotify, a.nome from artista_mais_tocado amt inner join artista a on a.idartista = amt.idartista where amt.idusuario = ? order by amt.ordem", [idusuario]);
          });
  
          return lista || [];
      }
  }