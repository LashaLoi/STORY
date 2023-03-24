import { QUESTIONS, START_COMMAND } from './constants.js'
import { handleRequest, sendQuestion } from './api.js'

import { bot } from './bot.js'

const state = {}

const initChat = (chatId, { username, firstName, lastName }) => {
  state[chatId] = {
    username,
    firstName,
    lastName,
    step: 0,
    pending: false,
  }
}

const deleteChat = (chatId) => {
  delete state[chatId]
}

const sendFinish = async (chatId) => {
  await bot.sendMessage(
    chatId,
    'Спасибо за обратную связь! Нам важно <b>твое</b> мнение.\n\n' +
      'Следи за нами в: <a href="https://instagram.com/story.baranovichi?utm_medium=copy_link">Intagram</a> и <a href="https://t.me/story1517">Telegram</a>\n\n' +
      'С уважением команда <b>STORY</b> и покорный слуга <code>story-bot</code>.\n\n' +
      'Обнимаем 🤗',
    {
      parse_mode: 'HTML',
      reply_markup: {
        hide_keyboard: true,
      },
    }
  )

  state[chatId] = { ...state[chatId], pending: true }

  await handleRequest(chatId, state[chatId])

  deleteChat(chatId)
}

const handleNextStep = (currentStep, { chatId, text }) => {
  state[chatId] = {
    ...state[chatId],
    [currentStep]: text,
    step: currentStep + 1,
  }
}

bot.on('message', (message) => {
  const currentChatId = message.chat.id

  if (message.text === START_COMMAND) {
    return
  }

  const currentStep = state[currentChatId]?.step ?? null
  const isPending = state[currentChatId]?.pending

  if (isPending) {
    return
  }

  if (currentStep !== null) {
    const nextStep = currentStep + 1

    handleNextStep(currentStep, {
      chatId: currentChatId,
      text: message.text,
    })

    if (nextStep === QUESTIONS.length) {
      return sendFinish(currentChatId)
    }

    return sendQuestion({ chatId: currentChatId, step: nextStep })
  }

  return bot.sendMessage(currentChatId, 'Чтобы начать введите команду /start')
})

export const startBot = () => {
  bot.onText(/\/start/, async (message) => {
    const chatId = message.chat.id
    const {
      username,
      first_name: firstName = '',
      last_name: lastName = '',
    } = message.from

    initChat(chatId, {
      username,
      firstName,
      lastName,
    })

    await sendQuestion({ chatId, step: 0 })
  })
}
