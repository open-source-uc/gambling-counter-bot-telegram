import { CommandContext, Composer } from "grammy";
import { Message } from "grammy/types";
import { BotContext } from "./context";
import { ChatInfo } from "../jwt";
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

const reset = async (ctx: CommandContext<BotContext>, word: string) => {
  if (!ctx.message) return;

  const user_id = ctx.message.from?.id.toString();
  if (!user_id) return;

  const userData = await ctx.env.DB.prepare(
    `SELECT win_count, total_count FROM gambling WHERE user_id = ?`
  ).bind(user_id).first<{ win_count: number; total_count: number } | null>();

  if (userData) {
    await ctx.env.DB.prepare(
      `UPDATE gambling 
       SET last_gamble_date = '', gambling_count_today = 0
       WHERE user_id = ?`
    ).bind(user_id).run();
  } else {
    await ctx.env.DB.prepare(
      `INSERT INTO gambling (user_id, last_gamble_date, gambling_count_today, win_count, total_count)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(user_id, '', 0, 0, 0).run();
  }

  const msg = new MessageBuilder()
    .add(`Has sido perdonado por ${word}.`)
    .build();

  await ctx.api.sendMessage(ctx.message.chat.id, msg, {
    message_thread_id: ctx.message.message_thread_id,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
};

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
  }

  const userData = await ctx.env.DB.prepare(
    `SELECT user_id, last_gamble_date, gambling_count_today, win_count, total_count 
     FROM gambling WHERE user_id = ?`
  ).bind(user_id).first<{
    user_id: string;
    last_gamble_date: string;
    gambling_count_today: number;
    win_count: number;
    total_count: number;
  }>();

  let gambling_count_today = 0;
  let last_gamble_date = "Nunca has jugado";
  let win_count = 0;
  let total_count = 0;

  if (userData) {
    gambling_count_today = userData.gambling_count_today;
    last_gamble_date = userData.last_gamble_date || "Nunca has jugado";
    win_count = userData.win_count;
    total_count = userData.total_count;
  }

  const now = Temporal.Now.zonedDateTimeISO("America/Santiago");
  const currentDate = `${now.day.toString().padStart(2, '0')}-${now.month.toString().padStart(2, '0')}-${now.year}`;

  if (last_gamble_date !== currentDate && last_gamble_date !== "Nunca has jugado") {
    gambling_count_today = 0;
  }

  const winRate = total_count > 0 ? ((win_count / total_count) * 100).toFixed(2) : "0.00";

  const msg = new MessageBuilder()
    .add(`@${ctx.message.from.username}`)
    .newLine(2)
    .add(`📊 <b>Estadísticas de Tragamonedas</b>`)
    .newLine(2)
    .add(`Has jugado ${gambling_count_today === 1 ? `1 vez` : `${gambling_count_today} veces`} hoy.`)
    .newLine(1)
    .add(`Tu última jugada fue el: '${last_gamble_date}'.`)
    .newLine(1)
    .add(`Total de jugadas en tu vida: ${total_count}.`)
    .newLine(1)
    .add(`Victorias: ${win_count} (${winRate}%)`)
    .newLine(2)
    .add(`Hoy es: '${currentDate}'.`)
    .build();

  await ctx.api.sendMessage(ctx.message.chat.id, msg, {
    message_thread_id: ctx.message.message_thread_id,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
});

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

commandComposer.command("lore", async (ctx) => {
  if (!ctx.message) return;

  const topPlayers = await ctx.env.DB.prepare(
    `SELECT user_id, nickname, win_count, total_count 
     FROM gambling 
     ORDER BY win_count DESC 
     LIMIT 3`
  ).all<{
    user_id: number;
    nickname: string;
    win_count: number;
    total_count: number;
  }>();

  const results = topPlayers.results;

  if (!results || results.length === 0) {
    const msg = new MessageBuilder()
      .add(`<b>🎰 Ranking de Tragamonedas 🎰</b>`)
      .newLine(2)
      .add(`Todavía no hay jugadores registrados.`)
      .build();

    await ctx.api.sendMessage(ctx.message.chat.id, msg, {
      message_thread_id: ctx.message.message_thread_id,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
    return;
  }

  const messageBuilder = new MessageBuilder()
    .add(`<b>🏆 PODIO DE TRAGAMONEDAS 🏆</b>`)
    .newLine(2);

  for (let i = 0; i < results.length; i++) {
    const player = results[i];
    const winRate = player.total_count > 0 ? ((player.win_count / player.total_count) * 100).toFixed(2) : "0.00";
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";

    const displayName = player.nickname || `Usuario #${player.user_id}`;

    messageBuilder
      .add(`${medal} <b>${displayName}</b>`)
      .newLine(1)
      .add(`   • Victorias: ${player.win_count}`)
      .newLine(1)
      .add(`   • Total jugadas: ${player.total_count}`)
      .newLine(1)
      .add(`   • Tasa de victoria: ${winRate}%`)
      .newLine(2);
  }

  messageBuilder
    .add(`<i>Usa el comando /ups para ver tus estadísticas</i>`);

  const msg = messageBuilder.build();

  await ctx.api.sendMessage(ctx.message.chat.id, msg, {
    message_thread_id: ctx.message.message_thread_id,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
});

commandComposer.on("message", async (ctx) => {
  if (!ctx.message) return;
  const chatInfo = getTargetChatType(ctx.message);

  try {
    // Verificar si el mensaje es un emoji de tragamonedas
    if (ctx.message.dice?.emoji !== "🎰") return;

    const user_id = ctx.message.from?.id.toString();
    const nickname = ctx.message.from?.username;

    // Verificar que tengamos tanto ID como nickname
    if (!user_id || !nickname) return;

    // Si el chat es privado, no permitir jugar
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
    }

    // Obtener datos del usuario
    let data = (await ctx.env.DB.prepare(
      `SELECT user_id, nickname, last_gamble_date, gambling_count_today, win_count, total_count 
       FROM gambling WHERE user_id = ?`
    ).bind(user_id).first<{
      user_id: string;
      nickname: string;
      last_gamble_date: string;
      gambling_count_today: number;
      win_count: number;
      total_count: number
    }>());

    // Si no existe el usuario, crearlo
    if (!data) {
      await ctx.env.DB.prepare(
        `INSERT INTO gambling (user_id, nickname, last_gamble_date, gambling_count_today, win_count, total_count)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(user_id, nickname, '', 0, 0, 0).run();

      data = {
        user_id,
        nickname,
        last_gamble_date: '',
        gambling_count_today: 0,
        win_count: 0,
        total_count: 0
      }
    }

    // Calcular fechas y contadores
    const now = Temporal.Now.zonedDateTimeISO("America/Santiago");
    const currentDate = `${now.day.toString().padStart(2, '0')}-${now.month.toString().padStart(2, '0')}-${now.year}`;
    const isNewDay = data.last_gamble_date !== currentDate;
    const gambling_count_today = isNewDay ? 1 : data.gambling_count_today + 1;
    const updatedTotalCount = data.total_count + 1;
    const diceValue = ctx.message.dice.value;
    const isWin = diceValue === 1 || diceValue === 22 || diceValue === 43 || diceValue === 64;
    const win_count = isWin ? data.win_count + 1 : data.win_count;

    // Verificar si ya jugó hoy
    if (!isNewDay && data.gambling_count_today > 0) {
      const msg = new MessageBuilder()
        .add(`Tú, @${ctx.message.from.username}, ya has jugado hoy, MERECES BAN.`)
        .build();

      await ctx.api.sendMessage(chatInfo.chatId, msg, {
        message_thread_id: chatInfo.topicId,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });

      // Actualizar solo el total de jugadas si ya jugó hoy
      await ctx.env.DB.prepare(
        `UPDATE gambling 
         SET total_count = ?, gambling_count_today = ?, nickname = ?
         WHERE user_id = ?`
      ).bind(
        updatedTotalCount,
        gambling_count_today,
        nickname,
        user_id
      ).run();

      // Mostrar mensaje si ganó (aunque no cuente)
      if (isWin) {
        const msg = new MessageBuilder()
          .add(`¡Felicidades @${ctx.message.from.username}! Has ganado en la tragamonedas. Pero no será contada por ser un tramposo.`)
          .build();

        await ctx.api.sendMessage(chatInfo.chatId, msg, {
          message_thread_id: chatInfo.topicId,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        });
      }
      return;
    }

    // Actualizar todos los datos si es su primera jugada del día
    await ctx.env.DB.prepare(`
      UPDATE gambling 
      SET last_gamble_date = ?, 
          gambling_count_today = ?, 
          win_count = ?,
          total_count = ?,
          nickname = ?
      WHERE user_id = ?
    `).bind(
      currentDate,
      gambling_count_today,
      win_count,
      updatedTotalCount,
      nickname,
      user_id
    ).run();

    // Mostrar mensaje si ganó
    if (isWin) {
      const msg = new MessageBuilder()
        .add(`¡Felicidades @${ctx.message.from.username}! Has ganado en la tragamonedas. 🎉 Esta es tu victoria #${win_count}`)
        .build();

      await ctx.api.sendMessage(chatInfo.chatId, msg, {
        message_thread_id: chatInfo.topicId,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    }
  } catch (error) {
    console.error("Error en el manejador de mensajes:", error);

    const msg = new MessageBuilder()
      .add(`Hubo un error al procesar tu solicitud. ${error}`)
      .build();

    await ctx.api.sendMessage(chatInfo.chatId, msg, {
      message_thread_id: chatInfo.topicId,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  }
});
