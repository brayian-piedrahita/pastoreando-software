# Casos de prueba y ambiente de pruebas

Esta carpeta guarda el formato de casos de prueba de Pastoreando y la definición del ambiente en el que se ejecutan.
El libro es `GA9-AA2-EV01_Casos_de_prueba.xlsx` y se diseñó a partir del plan de pruebas (`../plan/`).

## Qué contiene el libro

| Hoja | Contenido |
|---|---|
| Portada | Datos de la evidencia, estado de los casos (se calcula solo) y cómo se diligencia |
| Casos de prueba | 59 casos con los campos del formato: proyecto, número, nombre, fecha de revisión, descripción, ambiente, herramienta, autor, salida esperada, salida obtenida, resultado, seguimiento, severidad, evidencia y firma de aprobación. Además lleva requisito, módulo, tipo, prioridad y la prueba automatizada asociada |
| Ficha de caso | Vista de un caso por número, para imprimir o guardar en PDF |
| Ambiente de pruebas | Ocho ambientes (E1 a E8), software, hardware, usuarios de prueba, diferencias con producción y casos por requisito y ambiente |
| Trazabilidad | Requisitos contra casos y resultados, con la cobertura de cada uno |

## Convenciones

- Número de caso consecutivo: `CP-001`, `CP-002`, ... Es el mismo de `../plan/plantillas/caso_de_prueba.md`.
- Resultado: Aprobado, En seguimiento o Rechazado. Si el resultado no fue el esperado, el seguimiento lleva el código del defecto (`DEF-001`) y la severidad Alta, Media o Baja.
- Las columnas de ejecución (fecha de revisión, salida obtenida, resultado, seguimiento, severidad, evidencia y firma) se diligencian al ejecutar cada caso. El caso `CP-001` ya está ejecutado (corrida de JMeter del 25 de octubre de 2026).
- Los casos de RF07, RF08, RNF02 y la sincronización completa de RNF01 están diseñados y marcados como pendientes de construir: se ejecutan cuando exista la funcionalidad.
- Ninguna contraseña, token ni archivo `.env` se escribe en el libro. Los usuarios de prueba aparecen solo por su correo de demostración.
