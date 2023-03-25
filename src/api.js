import dotenv from 'dotenv'

import { QUESTIONS } from './constants.js'
import { supabase } from './config/supabase.js'
import { bot } from './config/bot.js'

dotenv.config()

export const sendData = async (data) => {
  const dateNow = new Date()
  const day = dateNow.getDay()

  if (day === 3 || day === 4) {
    const tableNumber = day - 2

    return supabase.from(`day${tableNumber}`).insert(data)
  }

  return supabase.from('daytest').insert(data)
}

export const sendToBot = (chatId, field) => {
  const { question, options } = QUESTIONS[field]

  return bot.sendMessage(
    chatId,
    question,
    options
      ? {
          reply_markup: {
            keyboard: options,
          },
        }
      : {
          reply_markup: {
            hide_keyboard: true,
          },
        }
  )
}
