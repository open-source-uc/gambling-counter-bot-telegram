# Telegram Bot

Este es un bot de Telegram que, al recibir un `FormData` en la ruta `/hook/osuc` mediante una petición `POST`, envía un mensaje personalizado al canal en el que se encuentre el bot y que tenga el mismo ID que la variable de entorno `TELEGRAM_CHAT_ID`, definida en el archivo `.dev.vars`.

## Variables de entorno

> **IMPORTANTE**
> El archivo debe llamarse **`.dev.vars`**.

```bash
BASE_URL=
JWT_SECRET=
TELEGRAM_BOT_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## Comandos

- **Desarrollo:**
  ```bash
    node --run dev
  ```
  Inicia el entorno de desarrollo.

- **Deploy:**
  ```bash
  node --run deploy
  ```
  Despliega el bot en Cloudflare Workers.

## Reporte técnico

### Estructura del código

#### `src/index.ts`
Aquí se encuentran las rutas de la API implementada con HonoJS para manejar el bot. Contiene:

- Una ruta que devuelve un "hi" para verificar fácilmente si está desplegado.
- La ruta `/hook/osuc`, que recibe un `FormData` y envía un mensaje al canal configurado en las variables de entorno.

#### `telegram/index.ts`

- **Ruta GET**: 
  - Configura el webhook del bot con `c.var.bot.api.setWebhook(\`\${c.env.BASE_URL}/telegram/webhook\`)`, lo que permite a Telegram enviar las solicitudes `POST` al bot.

- **Ruta POST**:
  - Telegram envía aquí los comandos del bot para ser procesados.
  - Se utiliza `TELEGRAM_BOT_SECRET` para validar que las solicitudes provienen exclusivamente de Telegram y evitar accesos no autorizados.

### Webhook y envío de mensajes
El webhook permite que Telegram notifique automáticamente al bot sobre nuevos mensajes o comandos. Además, la ruta `/hook/osuc` permite recibir un `FormData` y hacer que el bot envíe un mensaje al canal especificado en `TELEGRAM_CHAT_ID`.
