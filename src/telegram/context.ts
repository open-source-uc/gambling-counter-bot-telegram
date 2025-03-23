import { Context } from "grammy";

export type BotContext = Context & {
  env: {
    jwtSecret: string;
    gambling: KVNamespace;
  };
};
