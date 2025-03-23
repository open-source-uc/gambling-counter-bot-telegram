# Telegram Bot

Este es un bot de Telegram diseñado para contar la cantidad de veces que aparece el emoji de gambling. También cuenta con un sticker que indica si ganaste.

Este bot se ejecuta en Cloudflare mediante un Worker y utiliza una base de datos SQLite en D1.

## Variables de entorno (.dev.vars)

Para desarrollar este proyecto, necesitas definir las siguientes variables de entorno en un archivo `.dev.vars`:

```
BASE_URL= // URL del webhook, solo la base
JWT_SECRET= // Un valor aleatorio (el código fue tomado de Benja Vicente y funciona, así que no se modificó)
TELEGRAM_BOT_SECRET= // Palabra secreta para evitar abusos en la API
TELEGRAM_BOT_TOKEN= // Token de Telegram
```

## Configuración

En la carpeta `setup`, ejecuta `setup.sh` para crear las tablas e índices necesarios para obtener el podio.

## Reporte Técnico

Este bot fue creado utilizando `grammy.js` para interactuar con la API de Telegram, además de `Hono.js` para garantizar compatibilidad con Cloudflare Workers.

### Estructura del código
- Las rutas están definidas en `src/index.ts`:
  - `GET /`: Endpoint de prueba para verificar que la API está funcionando.
  - `GET /telegram/webhook`: Permite configurar el webhook que utilizará el bot.
  - `POST /telegram/webhook`: Recibe los datos enviados por Telegram cuando el bot detecta un mensaje.

### Archivos principales
- `context.ts`: Define las variables de entorno disponibles para el bot.
- `commands.ts`: Contiene los comandos del bot y el evento de mensaje para detectar el emoji de gambling.
- También incluye la lógica para interactuar con SQLite y manejar los datos del bot.
