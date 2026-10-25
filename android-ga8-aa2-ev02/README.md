# Pastoreando Móvil (GA8-AA2-EV02)

Aplicación Android nativa (Java) de Pastoreando. Consulta la API en línea del proyecto
(`https://pastoreando.onrender.com/api`) y ofrece tres pantallas:

| Pantalla | Qué hace |
|----------|----------|
| Inicio de sesión | Autentica con correo y contraseña; el servidor entrega el token y el rol. |
| Lotes y carga animal | Lista los lotes con el semáforo de carga (RF04): normal hasta 80 %, alerta hasta 100 % y sobrecarga por encima. |
| Calculadora de costos | Calcula el costo por cabeza con margen del 20 % (RF01) y muestra el desglose por rubro (RF02). Solo para propietario, arrendatario y contador. |

Sin conexión, la lista de lotes se muestra desde la última copia guardada en el teléfono y la
calculadora hace el cálculo local con las mismas reglas, avisándolo con un banner rojo.

## Requisitos

- Android Studio Panda 3 (2025.3.3) con JDK 21 y Android SDK 36.
- Teléfono con Android 7.0 (API 24) o superior y depuración por USB, o un emulador.
- El servidor gratuito de Render se duerme tras 15 minutos: abrir antes
  `https://pastoreando.onrender.com/api/salud` y esperar `{"estado":"ok"}`.

## Ejecutar

1. Abrir la carpeta `android-ga8-aa2-ev02` en Android Studio y esperar la sincronización de Gradle.
2. Elegir el dispositivo y pulsar **Run 'app'**.
3. Para generar solo el instalador: `./gradlew assembleDebug`. Queda en
   `app/build/outputs/apk/debug/app-debug.apk`.

## Pruebas unitarias

```
./gradlew testDebugUnitTest
```

89 pruebas en 11 clases (modelo, reglas de negocio, validadores, cliente HTTP contra un servidor
local simulado, conversor JSON, repositorios y formato). El reporte queda en
`app/build/reports/tests/testDebugUnitTest/index.html`.

## Estructura

```
app/src/main/java/co/pastoreando/app/
  modelo/      Tipos del dominio (Lote, EstadoCarga, NivelCarga, Rol, ResultadoCosto...)
  dominio/     Reglas: estrategias de costo, calculadora, validadores, resumen de carga
  datos/       Cliente HTTP (Singleton), conversor JSON, repositorios
  almacen/     Sesión y copia local en SharedPreferences
  ui/          Actividades, adaptador y componentes reutilizables
  Dependencias.java  Punto único donde se arman los repositorios
```

Patrones: separación en capas tipo MVC, Singleton en el cliente de la API y Strategy para el
cálculo según el propósito del ganado (Carne, Leche y Doble Propósito).

## Seguridad

- Único permiso: `INTERNET`.
- Tráfico solo por HTTPS (`usesCleartextTraffic=false`) y copias de seguridad desactivadas.
- Se guarda el token de sesión en almacenamiento privado; la contraseña no se guarda.
- La pantalla esconde la calculadora al técnico y el servidor igualmente responde 403.

## Usuarios de prueba

Uno por rol: `carlos.ramirez@pastoreando.co` (propietario), `brayian.piedrahita@pastoreando.co`
(arrendatario), `laura.gomez@pastoreando.co` (técnico) y `sandra.bedoya@pastoreando.co`
(contador). La contraseña de prueba está en el `README.md` de la raíz del repositorio.
