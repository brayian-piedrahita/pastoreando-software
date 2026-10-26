# Caso de prueba CP-001

| Campo | Valor |
|---|---|
| Nombre del proyecto | Pastoreando |
| Número de caso | CP-001 |
| Nombre del caso de prueba | Cálculo del costo por cabeza con propósito Carne |
| Requisito asociado | RF01 y RF02 |
| Fecha de revisión | 2026-10-25 |
| Descripción | Prueba funcional del servicio de cálculo, ejecutada como parte de la carga básica: verifica que, con costos conocidos y 50 animales de carne, el costo final por cabeza sea el que fijan las reglas de negocio (factor 1,00 y margen del 20 %) y que la respuesta traiga el desglose por rubro |
| Ambiente o entorno | API local de Pastoreando (FastAPI y Uvicorn) en `http://127.0.0.1:8000`, base SQLite de pruebas `data/jmeter_prueba.db`, Windows con Git Bash, Java Temurin 21 |
| Herramienta utilizada | Apache JMeter 5.6.3 (petición 04 del plan `docs/pruebas/jmeter/pastoreando_carga_basica.jmx`) |
| Autor del caso | Brayian Jhovany Piedrahita Cortes |
| Precondiciones | API en ejecución; usuario Contador de demostración con sesión iniciada (token en la variable `token`) |
| Datos de entrada | `POST /api/costos/calcular` con alimentación 6.000.000, mantenimiento 3.000.000, servicios 1.500.000, impuestos 1.500.000, 50 animales y propósito Carne |
| Pasos | 1. Iniciar sesión (petición 02). 2. Enviar la petición de cálculo con el token. 3. Revisar el código de respuesta y el contenido |
| Salida esperada | Código 200; subtotal del lote 12.000.000; costo base por cabeza 240.000; margen por cabeza 48.000; costo unitario final 288.000; total del lote 14.400.000; desglose Alimentación 50 %, Mantenimiento 25 %, Servicios 12,5 % e Impuestos 12,5 %; campo `id_calculo` presente; respuesta en menos de 2000 ms |
| Salida obtenida | Código 200; subtotal 12.000.000; costo base 240.000; margen 48.000; costo unitario final 288.000; total 14.400.000; desglose con los porcentajes esperados; `id_calculo` presente; tiempo medio de 14 ms y máximo de 36 ms en las 50 ejecuciones |
| Resultado | Aprobado |
| Seguimiento | No aplica |
| Severidad | No aplica |
| Evidencia | `docs/pruebas/jmeter/resultados/reporte_resumen.csv` (fila 04) y captura del árbol de resultados del informe GA9-AA1-EV01 |
| Firma de aprobación | Brayian Jhovany Piedrahita Cortes |
