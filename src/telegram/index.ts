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
      DB: c.env.DB,
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

  return c.text(`${c.env.BASE_URL}/telegram/webhook`, 200);
});

telegramApp.post("telegram/webhook", async (c) => {
  const secretToken = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  if (secretToken !== c.env.TELEGRAM_BOT_SECRET) {
    return c.text("Unauthorized", 401);
  }

  const update = await c.req.json();
  await c.var.bot.handleUpdate(update);

  return c.text("OK", 200);
});