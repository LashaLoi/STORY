import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import { QUESTIONS, OPTIONS, START_COMMAND } from './constants.js'
import { handleRequest } from './api.js'

dotenv.config()

const token = process.env.TG_TOKEN

const bot = new TelegramBot(token, { polling: true })

const state = {}

const sendQuestion = async ({ chatId, step }) => {
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

const greeting = async (chatId) => {
    await bot.sendMessage(
        chatId,
        `<b>Привет!</b> 👋🏻\n\nМеня зовут <code>story-bot</code>, и мы с командой рады, что ты пришел(а) на наши открытые дискуссии <b>STORY</b>!\n`,
        {
            parse_mode: 'HTML',
        }
    )

    await sendQuestion({ chatId, step: 0 })
}

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

const sendToCommonChannel = (info) =>
    bot.sendMessage(process.env.COMMOT_CHAT_ID, info)

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

    const { username, firstName, lastName } = state[chatId]
    const firstQuestion = state[chatId]['0']

    if (OPTIONS[0][0].includes(firstQuestion)) {
        const path =
            firstQuestion === OPTIONS[0][0][0]
                ? './assets/cat.mp4'
                : './assets/dog.mp4'

        await bot.sendVideo(chatId, path)
    }

    await sendToCommonChannel(
        `@${username} - ${firstName} ${lastName} закончил(а) отпрос.`
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

        if (nextStep === QUESTIONS.length) {
            handleNextStep(currentStep, {
                chatId: currentChatId,
                text: message.text,
            })

            return sendFinish(currentChatId)
        }

        handleNextStep(currentStep, {
            chatId: currentChatId,
            text: message.text,
        })

        return sendQuestion({ chatId: currentChatId, step: nextStep })
    }

    return bot.sendMessage(
        currentChatId,
        `<b>Привет!</b> 👋🏻\n\nМеня зовут <code>story-bot</code>, Чтобы начать введите команду /start`,
        { parse_mode: 'HTML' }
    )
})

export const startBot = () =>
    bot.onText(/\/start/, async (message) => {
        const chatId = message.chat.id
        const {
            username,
            first_name: firstName = '',
            last_name: lastName = '',
        } = message.from

        await greeting(chatId)

        initChat(chatId, {
            username,
            firstName,
            lastName,
        })

        await sendToCommonChannel(
            `@${username} - ${firstName} ${lastName} начал(а) отпрос.`
        )
    })
