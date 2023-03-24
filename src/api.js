import dotenv from 'dotenv'
import axios from 'axios'

import { QUESTIONS, OPTIONS } from './constants.js'

import { bot } from './bot.js'

dotenv.config()

const url = process.env.API_URL

export const handleRequest = async (chat) => {
  const { username } = chat

  const { data } = await axios.get(url)
  const user = data.find((item) => item.username === username)

  if (user) {
    return axios.put(`${url}/${user.id}`, chat)
  }

  return axios.post(url, chat)
}

export const sendQuestion = async ({ chatId, step }) => {
  const option = OPTIONS[step]

  return bot.sendMessage(
    chatId,
    QUESTIONS[step],
    option
      ? {
          reply_markup: {
            keyboard: option,
          },
        }
      : {
          reply_markup: {
            hide_keyboard: true,
          },
        }
  )
}
