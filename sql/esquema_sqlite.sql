-- Esquema SQLite de Pastoreando (desarrollo y pruebas).
-- Conserva los nombres del modelo relacional de la Guia 6: tablas en
-- MAYUSCULAS y columnas en camelCase. Los ENUM de MySQL se expresan con CHECK.

CREATE TABLE IF NOT EXISTS USUARIOS (
    idUsuario   INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT NOT NULL,
    apellidos   TEXT NOT NULL,
    cedula      TEXT NOT NULL,
    rolUsuario  TEXT NOT NULL
        CHECK (rolUsuario IN ('Propietario', 'Arrendatario', 'Tecnico', 'Contador')),
    correo      TEXT NOT NULL,
    contrasena  TEXT NOT NULL,
    CONSTRAINT uq_usuarios_cedula UNIQUE (cedula),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo)
);

CREATE TABLE IF NOT EXISTS LOTES (
    idLote          INTEGER PRIMARY KEY AUTOINCREMENT,
    idPropietario   INTEGER NOT NULL,
    nombreLote      TEXT NOT NULL,
    hectareas       REAL NOT NULL,
    capacidadCarga  INTEGER NOT NULL,
    tipoPastura     TEXT NOT NULL,
    CONSTRAINT chk_lotes_hectareas CHECK (hectareas > 0),
    CONSTRAINT chk_lotes_capacidad CHECK (capacidadCarga > 0),
    CONSTRAINT fk_lotes_propietario FOREIGN KEY (idPropietario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS CONTRATOS (
    idContrato       INTEGER PRIMARY KEY AUTOINCREMENT,
    idArrendatario   INTEGER NOT NULL,
    idLote           INTEGER NOT NULL,
    fechaInicio      TEXT NOT NULL,
    mesesDuracion    INTEGER NOT NULL,
    tarifaPorCabeza  REAL NOT NULL,
    estado           TEXT NOT NULL DEFAULT 'Activo'
        CHECK (estado IN ('Activo', 'Finalizado', 'Anulado')),
    CONSTRAINT chk_contratos_meses CHECK (mesesDuracion > 0),
    CONSTRAINT chk_contratos_tarifa CHECK (tarifaPorCabeza > 0),
    CONSTRAINT fk_contratos_arrendatario FOREIGN KEY (idArrendatario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_contratos_lote FOREIGN KEY (idLote)
        REFERENCES LOTES (idLote) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS GANADO (
    idGanado         INTEGER PRIMARY KEY AUTOINCREMENT,
    idContrato       INTEGER NOT NULL,
    raza             TEXT NOT NULL,
    cantidadCabezas  INTEGER NOT NULL,
    proposito        TEXT NOT NULL
        CHECK (proposito IN ('Carne', 'Leche', 'Doble Proposito')),
    CONSTRAINT chk_ganado_cabezas CHECK (cantidadCabezas > 0),
    CONSTRAINT fk_ganado_contrato FOREIGN KEY (idContrato)
        REFERENCES CONTRATOS (idContrato) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla auxiliar: guarda cada calculo de costos para reportes e historial (RF01).
CREATE TABLE IF NOT EXISTS HISTORIAL_COSTOS (
    idCalculo           INTEGER PRIMARY KEY AUTOINCREMENT,
    idUsuario           INTEGER NOT NULL,
    fechaCalculo        TEXT NOT NULL,
    proposito           TEXT NOT NULL,
    cantidadAnimales    INTEGER NOT NULL,
    subtotalLote        REAL NOT NULL,
    costoUnitarioFinal  REAL NOT NULL,
    totalLoteFinal      REAL NOT NULL,
    CONSTRAINT chk_historial_animales CHECK (cantidadAnimales > 0),
    CONSTRAINT fk_historial_usuario FOREIGN KEY (idUsuario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
);


-- AA5-EV03: pagos del contrato, recomendaciones del tecnico y firmas (RF05, RF06).
CREATE TABLE IF NOT EXISTS PAGOS (
    idPago       INTEGER PRIMARY KEY AUTOINCREMENT,
    idContrato   INTEGER NOT NULL,
    fechaPago    TEXT NOT NULL,
    montoTotal   REAL NOT NULL,
    metodoPago   TEXT NOT NULL
        CHECK (metodoPago IN ('Efectivo', 'Transferencia', 'PSE', 'Consignacion')),
    estadoPago   TEXT NOT NULL DEFAULT 'Pendiente'
        CHECK (estadoPago IN ('Pendiente', 'Confirmado', 'Rechazado')),
    CONSTRAINT chk_pagos_monto CHECK (montoTotal > 0),
    CONSTRAINT fk_pagos_contrato FOREIGN KEY (idContrato)
        REFERENCES CONTRATOS (idContrato) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Las recomendaciones pertenecen al hato: si el hato se elimina, se van con el.
CREATE TABLE IF NOT EXISTS RECOMENDACIONES (
    idRecomendacion    INTEGER PRIMARY KEY AUTOINCREMENT,
    idGanado           INTEGER NOT NULL,
    idZootecnista      INTEGER NOT NULL,
    fechaRecomendacion TEXT NOT NULL,
    descripcion        TEXT NOT NULL,
    CONSTRAINT fk_recomendaciones_ganado FOREIGN KEY (idGanado)
        REFERENCES GANADO (idGanado) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_recomendaciones_tecnico FOREIGN KEY (idZootecnista)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Cada parte firma una sola vez; la huella es el SHA-256 del texto firmado.
CREATE TABLE IF NOT EXISTS FIRMAS_CONTRATO (
    idFirma         INTEGER PRIMARY KEY AUTOINCREMENT,
    idContrato      INTEGER NOT NULL,
    idUsuario       INTEGER NOT NULL,
    rolFirmante     TEXT NOT NULL
        CHECK (rolFirmante IN ('Propietario', 'Arrendatario')),
    fechaFirma      TEXT NOT NULL,
    huellaDocumento TEXT NOT NULL,
    CONSTRAINT uq_firmas_contrato_usuario UNIQUE (idContrato, idUsuario),
    CONSTRAINT fk_firmas_contrato FOREIGN KEY (idContrato)
        REFERENCES CONTRATOS (idContrato) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_firmas_usuario FOREIGN KEY (idUsuario)
        REFERENCES USUARIOS (idUsuario) ON DELETE RESTRICT ON UPDATE CASCADE
);
