import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import dotenv from 'dotenv'
import { parseRequest } from './utils.js'
import { STEPS, QUESTIONS, OPTIONS, START_COMMAND } from './constants.js'

dotenv.config()

const url = process.env.API_URL
const token = process.env.TG_TOKEN

const bot = new TelegramBot(token, { polling: true })

const state = {}

export const handleRequest = async (chatId) => {
    const chat = state[chatId]
    const { username } = chat

    const { data } = await axios.get(url)
    const user = data.find((item) => item.username === `@${username}`)

    if (user) {
        return axios.put(`${url}/${user.id}`, parseRequest(chat))
    }

    return axios.post(url, parseRequest(chat))
}

const greeting = async (chatId) => {
    await bot.sendMessage(
        chatId,
        `<b>Привет!</b> 👋🏻\n\nМеня зовут <code>story-bot</code>, и мы с командой рады, что ты пришел(а) на наши открытые дискуссии <b>STORY</b>!\n\n${QUESTIONS[0]}`,
        { parse_mode: 'HTML' }
    )
}

const initChat = (chatId, { username, firstName, lastName }) => {
    state[chatId] = {
        username,
        firstName,
        lastName,
        1: '',
        2: '',
        3: '',
        4: '',
        step: STEPS[0],
    }
}

const deleteChat = (chatId) => {
    delete state[chatId]
}

const sendToCommonChannel = (info) =>
    bot.sendMessage(process.env.COMMOT_CHAT_ID, info)

const handleStep = ({ chatId, text, step, nextStep }, cb) => {
    state[chatId] = { ...state[chatId], [step]: text, step: nextStep }

    return cb(chatId)
}

const sendSecondQuestion = (chatId) =>
    bot.sendMessage(chatId, QUESTIONS[1], {
        reply_markup: {
            keyboard: OPTIONS[0],
        },
    })

const sendThirdQuestion = (chatId) =>
    bot.sendMessage(chatId, QUESTIONS[2], {
        reply_markup: {
            keyboard: OPTIONS[1],
        },
    })

const sendForeQuestion = (chatId) =>
    bot.sendMessage(chatId, QUESTIONS[3], {
        reply_markup: {
            hide_keyboard: true,
        },
    })

const sendFinish = async (chatId) => {
    await bot.sendMessage(
        chatId,
        'Спасибо за обратную связь! Нам важно <b>твое</b> мнение.\nС уважением команда <b>STORY</b> и покорный слуга <code>story-bot</code>.',
        { parse_mode: 'HTML' }
    )

    const { username, firstName, lastName } = state[chatId]

    await sendToCommonChannel(
        `@${username} - ${firstName} ${lastName} закончил(а) отпрос.`
    )

    await handleRequest(chatId)

    deleteChat(chatId)
}

bot.on('message', (message) => {
    const currentChatId = message.chat.id

    if (message.text === START_COMMAND) {
        return
    }

    const currentStep = state[currentChatId]?.step ?? null

    const data = {
        chatId: currentChatId,
        text: message.text,
    }

    switch (currentStep) {
        case STEPS[0]:
            return handleStep(
                { ...data, step: STEPS[0], nextStep: STEPS[1] },
                sendSecondQuestion
            )
        case STEPS[1]:
            return handleStep(
                { ...data, step: STEPS[1], nextStep: STEPS[2] },
                sendThirdQuestion
            )
        case STEPS[2]:
            return handleStep(
                { ...data, step: STEPS[2], nextStep: STEPS[3] },
                sendForeQuestion
            )
        case STEPS[3]:
            return handleStep(
                { ...data, step: STEPS[3], nextStep: 'finish' },
                sendFinish
            )
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
