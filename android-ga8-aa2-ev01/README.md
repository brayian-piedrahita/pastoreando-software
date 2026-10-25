# Pastoreando - Primera app Android (GA8-AA2-EV01)

Primera aplicación Android del proyecto **Pastoreando**, creada con Android Studio para
la evidencia GA8-220501096-AA2-EV01. Es una pantalla de bienvenida con la identidad
visual del proyecto (verde agrícola `#4CAF50`, fondo `#F5F5F5`) y un botón que muestra
un mensaje y la versión de Android del dispositivo en el que se ejecuta.

## Características del proyecto

| Elemento | Valor |
|---|---|
| IDE | Android Studio Panda 3 (2025.3.3 Patch 1) |
| Plantilla | Empty Views Activity |
| Lenguaje | Java |
| Paquete | `co.pastoreando.primeraapp` |
| SDK mínimo | API 24 (Android 7.0) |
| Configuración de compilación | Gradle con Kotlin DSL (`build.gradle.kts`) |

## Estructura

- `app/src/main/java/co/pastoreando/primeraapp/MainActivity.java`: actividad principal y evento del botón.
- `app/src/main/res/layout/activity_main.xml`: diseño de la pantalla (LinearLayout vertical).
- `app/src/main/res/values/strings.xml` y `colors.xml`: textos y colores de la aplicación.
- `app/src/main/AndroidManifest.xml`: declaración de la aplicación y de su actividad.
- `app/build.gradle.kts`, `build.gradle.kts`, `settings.gradle.kts`, `gradle/`: configuración de Gradle y wrapper.

## Cómo compilarla

1. Abrir la carpeta `android-ga8-aa2-ev01` desde Android Studio (**File > Open**) y esperar la sincronización de Gradle.
2. Compilar con **Build > Assemble 'app' Run Configuration**, o desde una terminal en esta carpeta:

```
gradlew.bat assembleDebug      (Windows)
./gradlew assembleDebug        (Linux y macOS)
```

3. El instalador queda en `app/build/outputs/apk/debug/app-debug.apk`.

## Cómo ejecutarla en un teléfono

1. Activar **Opciones de desarrollador** y **Depuración por USB** en el teléfono.
2. Conectarlo por USB, aceptar la huella del equipo y elegirlo en la lista de dispositivos de Android Studio.
3. Pulsar **Run**. En teléfonos Xiaomi también se debe activar **Instalar vía USB**.

## Qué no se versiona

`build/`, `.gradle/`, `local.properties` y `.idea/` dependen del equipo de desarrollo y se
regeneran al abrir el proyecto. Tampoco se versionan claves de firma (keystores).
