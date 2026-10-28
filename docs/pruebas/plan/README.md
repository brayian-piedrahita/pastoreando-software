# Artefactos del plan de pruebas

Esta carpeta guarda los modelos que se usan para llevar el registro de las pruebas de Pastoreando. El plan completo
(requisitos, estrategia, ambientes, metodología, cronograma, herramientas y riesgos) está en el documento
`GA9-AA1-EV02_Plan_de_pruebas.pdf` de la entrega; aquí quedan los formatos para diligenciar durante la ejecución.

## Contenido

| Archivo | Para qué sirve | Quién lo diligencia |
|---|---|---|
| `plantillas/caso_de_prueba.md` | Define un caso: qué se prueba, cómo, en qué ambiente y qué se espera | Quien diseña la prueba |
| `plantillas/registro_de_ejecucion.md` | Bitácora de cada ejecución: fecha, versión, ambiente, resultado | Quien ejecuta la prueba |
| `plantillas/reporte_de_defecto.md` | Describe un fallo encontrado y sigue su corrección hasta cerrarlo | Quien encuentra el fallo y quien lo corrige |
| `plantillas/matriz_de_trazabilidad.md` | Relaciona cada requisito con sus casos y con el último resultado | Responsable del plan |
| `plantillas/lista_de_revision_previa_a_entrega.md` | Doce comprobaciones de código, casos y documentos antes de entregar una evidencia | Quien entrega |
| `ejemplos/CP-001_calculo_costo_rf01.md` | Un caso ya diligenciado con una ejecución real | Referencia |

## Convenciones

- Los casos se numeran de forma consecutiva: `CP-001`, `CP-002`, y así sucesivamente. Un número no se reutiliza.
- Los defectos se numeran `DEF-001`, `DEF-002`. El campo «Seguimiento» de un caso apunta al defecto asociado.
- El resultado de un caso es uno de estos tres: **Aprobado** (salida obtenida igual a la esperada), **En seguimiento**
  (hay diferencia y existe un defecto abierto) o **Rechazado** (la diferencia impide cumplir el requisito).
- La severidad de un defecto es **Alta** (bloquea una función principal o expone datos), **Media** (la función
  trabaja con una limitación) o **Baja** (afecta la presentación o un caso poco frecuente).
- Ninguna evidencia incluye contraseñas, tokens ni el contenido del archivo `.env`.
