-- Pastoreando - modulo Java (GA7-AA2). Esquema MySQL 8.x / MariaDB.
--
-- Contiene unicamente las cuatro tablas que usa el modulo de lotes
-- (USUARIOS, LOTES, CONTRATOS y GANADO). Las definiciones son las mismas de
-- sql/esquema_mysql.sql del proyecto, de modo que ambos esquemas son compatibles.
--
-- Ejecucion (desde la carpeta modulo-java):
--   mysql -u root -p < sql/01_esquema.sql

CREATE DATABASE IF NOT EXISTS pastoreando CHARACTER SET utf8mb4;
USE pastoreando;

CREATE TABLE IF NOT EXISTS USUARIOS (
    idUsuario   INT AUTO_INCREMENT,
    nombre      VARCHAR(50) NOT NULL,
    apellidos   VARCHAR(50) NOT NULL,
    cedula      VARCHAR(15) NOT NULL,
    rolUsuario  ENUM('Propietario','Arrendatario','Tecnico','Contador') NOT NULL,
    correo      VARCHAR(100) NOT NULL,
    contrasena  VARCHAR(255) NOT NULL,
    CONSTRAINT pk_usuarios PRIMARY KEY (idUsuario),
    CONSTRAINT uq_usuarios_cedula UNIQUE (cedula),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS LOTES (
    idLote          INT AUTO_INCREMENT,
    idPropietario   INT NOT NULL,
    nombreLote      VARCHAR(50) NOT NULL,
    hectareas       DECIMAL(8,2) NOT NULL,
    capacidadCarga  INT NOT NULL,
    tipoPastura     VARCHAR(50) NOT NULL,
    CONSTRAINT pk_lotes PRIMARY KEY (idLote),
    CONSTRAINT chk_lotes_hectareas CHECK (hectareas > 0),
    CONSTRAINT chk_lotes_capacidad CHECK (capacidadCarga > 0),
    CONSTRAINT fk_lotes_propietario FOREIGN KEY (idPropietario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS CONTRATOS (
    idContrato       INT AUTO_INCREMENT,
    idArrendatario   INT NOT NULL,
    idLote           INT NOT NULL,
    fechaInicio      DATE NOT NULL,
    mesesDuracion    INT NOT NULL,
    tarifaPorCabeza  DECIMAL(10,2) NOT NULL,
    estado           ENUM('Activo','Finalizado','Anulado') NOT NULL DEFAULT 'Activo',
    CONSTRAINT pk_contratos PRIMARY KEY (idContrato),
    CONSTRAINT chk_contratos_meses CHECK (mesesDuracion > 0),
    CONSTRAINT chk_contratos_tarifa CHECK (tarifaPorCabeza > 0),
    CONSTRAINT fk_contratos_arrendatario FOREIGN KEY (idArrendatario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_contratos_lote FOREIGN KEY (idLote)
        REFERENCES LOTES (idLote) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS GANADO (
    idGanado         INT AUTO_INCREMENT,
    idContrato       INT NOT NULL,
    raza             VARCHAR(40) NOT NULL,
    cantidadCabezas  INT NOT NULL,
    proposito        ENUM('Carne','Leche','Doble Proposito') NOT NULL,
    CONSTRAINT pk_ganado PRIMARY KEY (idGanado),
    CONSTRAINT chk_ganado_cabezas CHECK (cantidadCabezas > 0),
    CONSTRAINT fk_ganado_contrato FOREIGN KEY (idContrato)
        REFERENCES CONTRATOS (idContrato) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
