# Sacar el APK desde tu telefono con GitHub

## Opcion mas rapida
1. Crea un repositorio nuevo en GitHub.
2. Sube todo el contenido de esta carpeta al repositorio.
3. Entra a la pestana **Actions**.
4. Busca el flujo **Build Android APK**.
5. Pulsa **Run workflow**.
6. Espera a que termine.
7. Abre el job completado y descarga el artefacto **manten-al-dia-debug-apk**.
8. Descomprime el artefacto y tendras `app-debug.apk`.
9. Abre ese APK en tu telefono Android e instalalo.

## Nota
- El APK generado es **debug**, sirve para instalarlo y probarlo.
- Para publicar en Play Store hay que firmar una version release.
