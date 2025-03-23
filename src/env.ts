import { Bot } from "grammy";
import { BotContext } from "./telegram/context";

export type Bindings = {
  BASE_URL: string;
  JWT_SECRET: string;
  TELEGRAM_BOT_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  gambling: KVNamespace;
};

export type Variables = {
  bot: Bot<BotContext>;
};

export type Env = {
  Bindings: Bindings;
  Variables: Variables;
};
