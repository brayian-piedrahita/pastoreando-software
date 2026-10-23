-- Pastoreando - modulo Java (GA7-AA2). Datos de prueba (ficticios).
--
-- Ejecutar UNA sola vez, despues de 01_esquema.sql:
--   mysql -u root -p < sql/02_datos_prueba.sql
--
-- Para empezar de cero: DROP DATABASE pastoreando; y volver a correr los dos scripts.
-- Clave de los usuarios de prueba: Pastoreando2026* (guardada con bcrypt).

USE pastoreando;

INSERT INTO USUARIOS (idUsuario, nombre, apellidos, cedula, rolUsuario, correo, contrasena) VALUES
(1, 'Carlos',  'Ramirez',  '1010101010', 'Propietario',  'carlos.ramirez@pastoreando.co',    '$2b$12$61PYJkBxny6a.LQoUvgiu.OyCRr1HEYulCPlskg36msbd4.5LZHDG'),
(2, 'Brayian', 'Piedrahita', '1020202020', 'Arrendatario', 'brayian.piedrahita@pastoreando.co', '$2b$12$61PYJkBxny6a.LQoUvgiu.OyCRr1HEYulCPlskg36msbd4.5LZHDG'),
(3, 'Laura',   'Gomez',    '1030303030', 'Tecnico',      'laura.gomez@pastoreando.co',       '$2b$12$61PYJkBxny6a.LQoUvgiu.OyCRr1HEYulCPlskg36msbd4.5LZHDG'),
(4, 'Sandra',  'Bedoya',   '1040404040', 'Contador',     'sandra.bedoya@pastoreando.co',     '$2b$12$61PYJkBxny6a.LQoUvgiu.OyCRr1HEYulCPlskg36msbd4.5LZHDG'),
(5, 'Jhon',    'Osorio',   '1050505050', 'Arrendatario', 'jhon.osorio@pastoreando.co',       '$2b$12$61PYJkBxny6a.LQoUvgiu.OyCRr1HEYulCPlskg36msbd4.5LZHDG'),
(6, 'Marta',   'Londono',  '1060606060', 'Propietario',  'marta.londono@pastoreando.co',     '$2b$12$61PYJkBxny6a.LQoUvgiu.OyCRr1HEYulCPlskg36msbd4.5LZHDG');

-- Cinco lotes: cuatro de Carlos (propietario 1) y uno de Marta (propietario 6).
INSERT INTO LOTES (idLote, idPropietario, nombreLote, hectareas, capacidadCarga, tipoPastura) VALUES
(1, 1, 'Lote 01',            20.00, 40, 'Kikuyo'),
(2, 1, 'Lote 02',            15.50, 30, 'Brachiaria'),
(3, 1, 'Lote 03',             8.00, 20, 'Estrella Africana'),
(4, 1, 'Lote 04',            12.00, 25, 'Pasto Elefante'),
(5, 6, 'Lote La Esperanza',  30.00, 60, 'Kikuyo');

-- Contratos: el 2 esta Finalizado, por eso su ganado no cuenta en la carga actual.
INSERT INTO CONTRATOS (idContrato, idArrendatario, idLote, fechaInicio, mesesDuracion, tarifaPorCabeza, estado) VALUES
(1, 2, 1, '2026-08-01', 6, 45000.00, 'Activo'),
(2, 5, 1, '2026-01-01', 6, 40000.00, 'Finalizado'),
(3, 2, 2, '2026-09-01', 3, 50000.00, 'Activo'),
(4, 5, 3, '2026-10-01', 4, 42000.00, 'Activo'),
(5, 2, 3, '2026-10-05', 4, 42000.00, 'Activo');

-- Resultado esperado de la carga actual:
--   Lote 01: 25 + 13 = 38 de 40 (95 %)   -> ALERTA
--   Lote 02: 12 de 30 (40 %)             -> NORMAL
--   Lote 03: 14 + 10 = 24 de 20 (120 %)  -> SOBRECARGA
--   Lote 04: sin contratos (0 %)         -> NORMAL, se puede eliminar
INSERT INTO GANADO (idGanado, idContrato, raza, cantidadCabezas, proposito) VALUES
(1, 1, 'Brahman',  25, 'Carne'),
(2, 1, 'Cebu',     13, 'Carne'),
(3, 2, 'Normando', 10, 'Doble Proposito'),
(4, 3, 'Holstein', 12, 'Leche'),
(5, 4, 'Brahman',  14, 'Carne'),
(6, 5, 'Gyr',      10, 'Carne');
