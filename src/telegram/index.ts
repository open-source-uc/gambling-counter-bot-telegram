import { Hono } from "hono";
import { Bot } from "grammy";

import { commandComposer } from "./commands";
import { BotContext } from "./context";

import { Env } from "../env";

export const telegramApp = new Hono<Env>();

telegramApp.use("*", async (c, next) => {
  // Poner el bot en el contexto de la API de hono
  const bot = new Bot<BotContext>(c.env.TELEGRAM_BOT_TOKEN);

  bot.use((ctx, next) => {
    ctx.env = {
      jwtSecret: c.env.JWT_SECRET,
    };
    return next();
  });

  bot.use(commandComposer);

  await bot.init();
  c.set("bot", bot);
  await next();
});

telegramApp.get("telegram/webhook", async (c) => {
  await c.var.bot.api.setWebhook(`${c.env.BASE_URL}/telegram/webhook`, {
    secret_token: c.env.TELEGRAM_BOT_SECRET,
  });

  return c.text("OK", 200);
});

// telegramApp.post("telegram/webhook", async (c) => {
//   const providedSecret = c.req.header("X-Telegram-Bot-Api-Secret-Token");

//   if (providedSecret !== c.env.TELEGRAM_BOT_SECRET) {
//     c.status(401);
//     return c.text("Unauthorized");
//   }

//   await c.var.bot.handleUpdate(await c.req.json<any>());
//   return c.text("OK", 200);
// });
