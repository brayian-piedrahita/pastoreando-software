# Ejecución de las pruebas · GA9-AA3

Resultados de ejecutar los 59 casos del libro de la actividad anterior (`docs/pruebas/casos/`), el 26 de octubre de 2026.

| Archivo o carpeta | Contenido |
|---|---|
| `registro_de_ejecucion.md` | Una fila por cada ejecución de un caso, con versión, ambiente, herramienta, resultado y evidencia |
| `defectos/DEF-001.md` | Reporte del defecto encontrado por CP-007, con su corrección y su verificación |
| `resultados/` | Registros de pytest (SQLite y MySQL 8.4), de Vitest antes y después de la corrección, y resultados de JMeter |
| `GA9-AA3-EV01_Casos_ejecutados.xlsx` | Libro de casos con las columnas de ejecución diligenciadas |

Estado final: 55 casos aprobados de 59, incluidos los 15 críticos; 4 sin ejecutar (CP-056 a CP-059) porque dependen de funciones que el sistema todavía no tiene.

La versión probada es la etiqueta `ga9-aa2-ev01` (commit `bca75b3`). La corrección del DEF-001 está en la rama `feature/ga9-aa3-ev01`.
