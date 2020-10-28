CREATE DATABASE IF NOT EXISTS spotify;
USE spotify;

CREATE TABLE usuario (
  idusuario bigint NOT NULL AUTO_INCREMENT,
  idspotify varchar(50) NOT NULL,
  nome varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  telefone varchar(50) DEFAULT NULL,
  token varchar(50) DEFAULT NULL,
  accessToken varchar(200) DEFAULT NULL,
  refreshToken varchar(200) DEFAULT NULL,
  validadeToken bigint DEFAULT NULL,
  criacao datetime NOT NULL,
  PRIMARY KEY (idusuario),
  UNIQUE KEY usuario_idspotify_UN (idspotify)
);

CREATE TABLE musica (
  idmusica bigint NOT NULL AUTO_INCREMENT,
  idspotify varchar(50) NOT NULL,
  nome varchar(100) NOT NULL,
  idalbum varchar(50) NOT NULL,
  nomealbum varchar(50) NOT NULL,
  PRIMARY KEY (idmusica),
  UNIQUE KEY musica_idspotify_UN (idspotify)
);

CREATE TABLE artista (
  idartista bigint NOT NULL AUTO_INCREMENT,
  idspotify varchar(50) NOT NULL,
  nome varchar(100) NOT NULL,
  PRIMARY KEY (idartista),
  UNIQUE KEY artista_idspotify_UN (idspotify)
);

CREATE TABLE genero (
  idgenero bigint NOT NULL AUTO_INCREMENT,
  idspotify varchar(50) NOT NULL,
  nome varchar(100) NOT NULL,
  PRIMARY KEY (idgenero),
  UNIQUE KEY genero_idspotify_UN (idspotify)
);

CREATE TABLE artista_genero (
  idartista_genero bigint NOT NULL AUTO_INCREMENT,
  idartista bigint NOT NULL,
  idgenero bigint NOT NULL,
  PRIMARY KEY (idartista_genero),
  UNIQUE KEY artista_genero_UN (idartista, idgenero),
  KEY (idgenero),
  CONSTRAINT artista_genero_idartista_FK FOREIGN KEY (idartista) REFERENCES artista (idartista) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT artista_genero_idgenero_FK FOREIGN KEY (idgenero) REFERENCES genero (idgenero) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE artista_mais_tocado (
  idartista_mais_tocado bigint NOT NULL AUTO_INCREMENT,
  idusuario bigint NOT NULL,
  idartista bigint NOT NULL,
  PRIMARY KEY (idartista_mais_tocado),
  UNIQUE KEY artista_mais_tocado_UN (idusuario, idartista),
  KEY (idartista),
  CONSTRAINT artista_mais_tocado_idusuario_FK FOREIGN KEY (idusuario) REFERENCES usuario (idusuario) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT artista_mais_tocado_idartista_FK FOREIGN KEY (idartista) REFERENCES artista (idartista) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE musica_mais_tocada (
  idmusica_mais_tocada bigint NOT NULL AUTO_INCREMENT,
  idusuario bigint NOT NULL,
  idmusica bigint NOT NULL,
  PRIMARY KEY (idmusica_mais_tocada),
  UNIQUE KEY idmusica_mais_tocada_UN (idusuario, idmusica),
  KEY (idmusica),
  CONSTRAINT idmusica_mais_tocada_idusuario_FK FOREIGN KEY (idusuario) REFERENCES usuario (idusuario) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT idmusica_mais_tocada_idmusica_FK FOREIGN KEY (idmusica) REFERENCES musica (idmusica) ON DELETE CASCADE ON UPDATE RESTRICT
);
