# Lista de revisión previa a la entrega

| Campo | Valor |
|---|---|
| Evidencia | GA__-AA__-EV__ |
| Fecha de la revisión | AAAA-MM-DD |
| Revisado por | |
| Versión revisada | Rama o etiqueta y commit |

Se diligencia antes de entregar una evidencia, con la última ejecución de las pruebas a la vista. Cada ítem se
marca **Sí**, **No** o **N.A.** (no aplica). Un **No** se corrige antes de entregar o queda anotado en la
observación con la decisión tomada.

| N.º | Verificación | Sí | No | N.A. | Observación |
|---|---|---|---|---|---|
| | **Código y diseño** | | | | |
| R1 | El cambio tiene criterios de aceptación escritos, con valores límite | | | | |
| R2 | Cada pantalla se probó con datos inválidos después de un resultado válido (no queda un resultado anterior) | | | | |
| R3 | Antes de fijar un límite en una prueba se leyeron las reglas de validación del código (`app/domain/validaciones.py`) | | | | |
| R4 | Pruebas en verde, `black --check` y `flake8` sin observaciones | | | | |
| | **Casos de prueba** | | | | |
| R5 | Cada caso tiene asignada la herramienta que de verdad lo cubre, y se comprobó | | | | |
| R6 | La descripción del caso corresponde al ambiente donde se ejecuta | | | | |
| R7 | Cada caso tiene requisito asociado y aparece en la matriz de trazabilidad | | | | |
| | **Documentos y configuración** | | | | |
| R8 | Cada cifra citada (pruebas, tiempos, cobertura) coincide con la última ejecución registrada | | | | |
| R9 | Cada afirmación sobre el comportamiento del sistema se comprobó en el sistema, no se copió de otro documento | | | | |
| R10 | Los valores de configuración coinciden entre los archivos de despliegue y el código | | | | |
| R11 | Las variables de entorno que exige el código existen en el ambiente publicado | | | | |
| R12 | Ningún documento incluye contraseñas, tokens ni el contenido del archivo `.env` | | | | |

Cada ítem nace de un defecto real del proyecto: R1 y R2 de DEF-001, R3, R5, R6 y R7 de los tres errores de
planteamiento de pruebas del 26 de octubre de 2026, R8 de las cifras desactualizadas de `DESPLIEGUE.md` y `MODULOS.md`, R9 de una
afirmación sobre la caché que no correspondía al sistema, R10 de la diferencia de rondas de bcrypt entre
`render.yaml` y el código, y R11 de una variable de entorno ausente en el sitio publicado.
