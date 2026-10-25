# Carga básica de la API con Apache JMeter

Este plan comprueba que los servicios centrales de Pastoreando responden de forma correcta y rápida cuando
varios usuarios los consultan al mismo tiempo. Se ejecuta contra la API local, con la base SQLite de pruebas,
para no tocar la versión publicada en Render ni la base de Aiven.

## Contenido

| Archivo | Qué es |
|---|---|
| `pastoreando_carga_basica.jmx` | Plan de pruebas de JMeter 5.6.3 |
| `resultados/reporte_resumen.csv` | Summary Report exportado de la ejecución |
| `resultados/reporte_agregado.csv` | Aggregate Report exportado de la ejecución (mediana y percentiles) |

## Qué hace el plan

Diez usuarios virtuales entran de forma escalonada durante 5 segundos y repiten cinco veces la misma secuencia,
con una pausa de 300 ms entre peticiones. En total son 250 muestras.

| N.º | Petición | Comprobaciones |
|---|---|---|
| 01 | `GET /api/salud` | Código 200 y respuesta en menos de 2000 ms |
| 02 | `POST /api/auth/login` (Contador) | Código 200, extrae `token` del JSON y respuesta en menos de 3000 ms |
| 03 | `GET /api/lotes` con `Authorization: Bearer ${token}` | Código 200 y respuesta en menos de 2000 ms |
| 04 | `POST /api/costos/calcular` (RF01, 50 animales de carne) | Código 200, el JSON trae `id_calculo` y respuesta en menos de 2000 ms |
| 05 | `GET /api/auth/yo` sin token | Código 401 (el rechazo es el resultado esperado) |

La contraseña no está escrita en el plan: se recibe con la propiedad `-Jclave` y se lee dentro del plan con
`${__P(clave,)}`.

## Cómo ejecutarlo

1. Iniciar la API local con la base de pruebas (Git Bash, en la raíz del repositorio):

   ```bash
   source venv/Scripts/activate
   python -m uvicorn app.main:app
   ```

2. En otra terminal, pedir la contraseña de demostración y abrir JMeter con el plan:

   ```bash
   read -r -p "Contraseña de demostración: " CLAVE
   jmeter -Jclave="$CLAVE" -t docs/pruebas/jmeter/pastoreando_carga_basica.jmx
   ```

3. Pulsar **Start** (botón verde). Los resultados se ven en *Summary Report*, *Aggregate Report* y *View Results Tree*.

Para repetir la ejecución sin interfaz y guardar el resultado en un archivo:

```bash
jmeter -n -Jclave="$CLAVE" -t docs/pruebas/jmeter/pastoreando_carga_basica.jmx -l resultados.jtl
```

## Resultado obtenido

| Petición | Muestras | Media (ms) | Mediana (ms) | P95 (ms) | Máx. (ms) | Errores |
|---|---:|---:|---:|---:|---:|---:|
| 01 Salud | 50 | 3 | 2 | 6 | 36 | 0,000 % |
| 02 Inicio de sesión | 50 | 208 | 207 | 219 | 224 | 0,000 % |
| 03 Listado de lotes | 50 | 6 | 4 | 12 | 33 | 0,000 % |
| 04 Cálculo RF01 | 50 | 14 | 12 | 24 | 36 | 0,000 % |
| 05 Consulta sin token | 50 | 2 | 2 | 4 | 8 | 0,000 % |
| **Total** | **250** | **46** | **6** | **212** | **224** | **0,000 %** |

Rendimiento global: 19,3 peticiones por segundo. El inicio de sesión es la petición más lenta (cercana a
200 ms) porque verifica la contraseña con bcrypt, que es un costo deliberado de seguridad.
