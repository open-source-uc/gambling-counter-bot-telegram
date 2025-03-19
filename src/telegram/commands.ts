import { Composer } from "grammy";
import { Message } from "grammy/types";
import { BotContext } from "./context";
import { ChatInfo, encodeChatInfo } from "../jwt";
import { MessageBuilder } from "../utils/msgBuilder";

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
    .add("El bot está funcionando :D")
    .newLine(2)
    .add(`La ID de este chat es: ${chatInfo.chatId}`)
    .newLine(1)
    .add(`La ID del tema es: ${ctx.message.message_thread_id}`)
    .newLine(2)
    .build();

  await ctx.api.sendMessage(chatInfo.chatId, msg, {
    message_thread_id: chatInfo.topicId,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
});
