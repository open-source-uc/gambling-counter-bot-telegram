import { CommandContext, Composer } from "grammy";
import { Message } from "grammy/types";
import { BotContext } from "./context";
import { ChatInfo, encodeChatInfo } from "../jwt";
import { MessageBuilder } from "../utils/msgBuilder";
import { Temporal } from '@js-temporal/polyfill';

export const commandComposer = new Composer<BotContext>();

function getTargetChatType(msg: Message): ChatInfo {
  if (msg.chat.type === "supergroup" && msg.is_topic_message) {
    return { chatId: msg.chat.id, topicId: msg.message_thread_id, isSimpleGroup: false };
  }

  if (msg.chat.type === "group") {
    return { chatId: msg.chat.id, isSimpleGroup: true };
  }

  return { chatId: msg.chat.id };
}

commandComposer.command("status", async (ctx) => {
  if (!ctx.message) return;

  const chatInfo = getTargetChatType(ctx.message);

  const msg = new MessageBuilder()
    .add("Estoy vivo.")
    .newLine(2)
    .add("Código robado de BV.")
    .newLine(2)
    .build();

  await ctx.api.sendMessage(chatInfo.chatId, msg, {
    message_thread_id: chatInfo.topicId,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
})

commandComposer.command("ups", async (ctx) => {
  if (!ctx.message) return;
  const user_id = ctx.message.from?.id.toString();

  if (!user_id) {
    const msg = new MessageBuilder()
      .add(`@${ctx.message.from.username}`)
      .newLine(2)
      .add(`Eres void*.`)
      .build();

    await ctx.api.sendMessage(ctx.message.chat.id, msg, {
      message_thread_id: ctx.message.message_thread_id,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
    return;
  };
  const data = await ctx.env.gambling.get<{ gambling_count?: number; last_gamble_date?: string }>(user_id, "json");

  const current_gambling_count = data?.gambling_count ?? 0;
  const last_gamble_date = data?.last_gamble_date;
  const now = Temporal.Now.zonedDateTimeISO("America/Santiago");
  const currentDate = `${now.day.toString().padStart(2, '0')}-${now.month.toString().padStart(2, '0')}-${now.year}`;


  const msg = new MessageBuilder()
    .add(`@${ctx.message.from.username}`)
    .newLine(2)
    .add(`Has jugado ${current_gambling_count === 1 ? `1 vez` : `${current_gambling_count} veces`}.`)
    .newLine(1)
    .add(`Tu última jugada fue el: '${last_gamble_date ?? "Ni idea"}'.`)
    .newLine(1)
    .add(`Hoy es ${currentDate}.`)
    .build();

  await ctx.api.sendMessage(ctx.message.chat.id, msg, {
    message_thread_id: ctx.message.message_thread_id,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
})

commandComposer.on("message", async (ctx) => {
  if (!ctx.message) return;

  const chatInfo = getTargetChatType(ctx.message);
  const user_id = ctx.message.from?.id.toString();

  if (!user_id) return;
  if (ctx.message.dice?.emoji !== "🎰") return;

  if (ctx.message.chat.type === "private") {
    const msg = new MessageBuilder()
      .add(`Tú, @${ctx.message.from.username}, eres hermoso, pero no puedes jugar aquí.`)
      .build();

    await ctx.api.sendMessage(chatInfo.chatId, msg, {
      message_thread_id: chatInfo.topicId,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });

    return;
  };

  const data = await ctx.env.gambling.get<{ gambling_count?: number; last_gamble_date?: string }>(user_id, "json");

  const current_gambling_count = data?.gambling_count ?? 0;
  const last_gamble_date = data?.last_gamble_date ?? "";

  const now = Temporal.Now.zonedDateTimeISO("America/Santiago");
  const currentDate = `${now.day.toString().padStart(2, '0')}-${now.month.toString().padStart(2, '0')}-${now.year}`;


  if (last_gamble_date === currentDate) {
    const msg = new MessageBuilder()
      .add(`Tú, @${ctx.message.from.username}, ya has jugado hoy, MERECES BAN.`)
      .build();

    await ctx.env.gambling.put(user_id, JSON.stringify({
      gambling_count: current_gambling_count + 1,
      last_gamble_date: currentDate,
    }));

    await ctx.api.sendMessage(chatInfo.chatId, msg, {
      message_thread_id: chatInfo.topicId,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });

    return;
  }

  await ctx.env.gambling.put(user_id, JSON.stringify({
    gambling_count: 1,
    last_gamble_date: currentDate,
  }));
});

