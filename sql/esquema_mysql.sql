-- Esquema MySQL/MariaDB de produccion (mismo modelo de la Guia 6, en 3FN).
-- La aplicacion usa SQLite en desarrollo; este script es la referencia para
-- el servidor de produccion. Se ejecuta en el orden de dependencias.

CREATE TABLE USUARIOS (
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

CREATE TABLE LOTES (
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

CREATE TABLE CONTRATOS (
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

CREATE TABLE GANADO (
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

-- Tabla auxiliar para el historial de calculos de costos (RF01).
CREATE TABLE HISTORIAL_COSTOS (
    idCalculo           INT AUTO_INCREMENT,
    idUsuario           INT NOT NULL,
    fechaCalculo        DATETIME NOT NULL,
    proposito           ENUM('Carne','Leche','Doble Proposito') NOT NULL,
    cantidadAnimales    INT NOT NULL,
    subtotalLote        DECIMAL(14,2) NOT NULL,
    costoUnitarioFinal  DECIMAL(12,2) NOT NULL,
    totalLoteFinal      DECIMAL(16,2) NOT NULL,
    CONSTRAINT pk_historial_costos PRIMARY KEY (idCalculo),
    CONSTRAINT chk_historial_animales CHECK (cantidadAnimales > 0),
    CONSTRAINT fk_historial_usuario FOREIGN KEY (idUsuario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


-- AA5-EV03: pagos del contrato, recomendaciones del tecnico y firmas (RF05, RF06).
CREATE TABLE PAGOS (
    idPago       INT AUTO_INCREMENT,
    idContrato   INT NOT NULL,
    fechaPago    DATE NOT NULL,
    montoTotal   DECIMAL(14,2) NOT NULL,
    metodoPago   ENUM('Efectivo','Transferencia','PSE','Consignacion') NOT NULL,
    estadoPago   ENUM('Pendiente','Confirmado','Rechazado') NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT pk_pagos PRIMARY KEY (idPago),
    CONSTRAINT chk_pagos_monto CHECK (montoTotal > 0),
    CONSTRAINT fk_pagos_contrato FOREIGN KEY (idContrato)
        REFERENCES CONTRATOS (idContrato) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Las recomendaciones pertenecen al hato: si el hato se elimina, se van con el.
CREATE TABLE RECOMENDACIONES (
    idRecomendacion    INT AUTO_INCREMENT,
    idGanado           INT NOT NULL,
    idZootecnista      INT NOT NULL,
    fechaRecomendacion DATE NOT NULL,
    descripcion        TEXT NOT NULL,
    CONSTRAINT pk_recomendaciones PRIMARY KEY (idRecomendacion),
    CONSTRAINT fk_recomendaciones_ganado FOREIGN KEY (idGanado)
        REFERENCES GANADO (idGanado) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_recomendaciones_tecnico FOREIGN KEY (idZootecnista)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Cada parte firma una sola vez; la huella es el SHA-256 del texto firmado.
CREATE TABLE FIRMAS_CONTRATO (
    idFirma         INT AUTO_INCREMENT,
    idContrato      INT NOT NULL,
    idUsuario       INT NOT NULL,
    rolFirmante     ENUM('Propietario','Arrendatario') NOT NULL,
    fechaFirma      DATETIME NOT NULL,
    huellaDocumento CHAR(64) NOT NULL,
    CONSTRAINT pk_firmas PRIMARY KEY (idFirma),
    CONSTRAINT uq_firmas_contrato_usuario UNIQUE (idContrato, idUsuario),
    CONSTRAINT fk_firmas_contrato FOREIGN KEY (idContrato)
        REFERENCES CONTRATOS (idContrato) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_firmas_usuario FOREIGN KEY (idUsuario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
