# Mantén al Día - Android Studio

Proyecto Android listo para abrir en Android Studio.

## Qué incluye
- WebView cargando la app local desde `assets/index.html`
- Soporte para `localStorage`
- Importar respaldo JSON con selector de archivos
- Exportar respaldo JSON con guardado nativo
- Notificaciones Android mientras la app está abierta o cuando vuelves a abrirla

## Qué falta
- No hay avisos programados en segundo plano con la app cerrada.
- Para eso habría que migrar la lógica de mantenimientos a almacenamiento nativo + WorkManager.

## Cómo compilar
1. Abre esta carpeta en Android Studio.
2. Espera a que Gradle sincronice.
3. Ejecuta en un teléfono Android o emulador.
4. Desde Android Studio puedes generar APK con `Build > Build APK(s)`.

## Estructura clave
- `app/src/main/assets/index.html`: app web integrada
- `app/src/main/java/com/systempos/mantenaldia/MainActivity.kt`: contenedor Android
- `app/build.gradle`: configuración del módulo
