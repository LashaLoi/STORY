const TelegramBot = require('node-telegram-bot-api')
const { initEffects } = require('./init')
const { QUESTIONS } = require('./constants')

initEffects()

const bot = new TelegramBot(process.env.TG_TOKEN, { polling: true })

const chats = {}

const greeting = async (chatId) => {
    await bot.sendMessage(
        chatId,
        `<b>Привет!</b> 👋🏻\n\nМеня зовут <code>story-bot</code>, и мы с командой рады, что ты пришел(а) на наши открытые дискуссии <b>STORY</b>!\n\nА как тебя зовут?)`,
        { parse_mode: 'HTML' }
    )
}

const sendToCommonChannel = (info) =>
    bot.sendMessage(process.env.COMMOT_CHAT_ID, info)

const getCurrentChat = (chatId) => chats[chatId]
const increaseCurrentChatStep = (chatId) => chats[chatId].steps++

bot.on('message', async (msg) => {
    const chatId = msg.chat.id

    if (!getCurrentChat(chatId)) return

    const currentStep = chats[chatId].steps

    switch (currentStep) {
        case 0:
            if (chats[chatId].firstStep === 'init') {
                await bot.sendMessage(chatId, QUESTIONS[currentStep])

                chats[chatId].firstStep = 'active'
                return
            }

            if (chats[chatId].firstStep === 'active') {
                await bot.sendMessage(msg.chat.id, 'Записать ответ?', {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [
                                {
                                    text: 'Да',
                                    callback_data: 'firstStep-yes',
                                },
                            ],
                            [
                                {
                                    text: 'Нет',
                                    callback_data: 'firstStep-no',
                                },
                            ],
                        ],
                    }),
                })

                chats[chatId].currentMessage = msg.text

                // chats[chatId].firstStep = 'done'
            }

            if (chats[chatId].firstStep === 'done') {
                increaseCurrentChatStep(chatId)
            }

            return
        case 1:
            await bot.sendMessage(
                chatId,
                'какую темы ты бы хотел обсудить больше?'
            )

            chats[chatId].secondStep = msg.text

            increaseCurrentChatStep(chatId)
            return
        case 2:
            await bot.sendMessage(
                chatId,
                'хотел бы ты встретиться с кем-нибудь лично и обсудить тему?'
            )

            chats[chatId].thirdStep = msg.text

            increaseCurrentChatStep(chatId)
            return
        case 3:
            await bot.sendMessage(chatId, 'как с тобой можно связаться?')

            chats[chatId].foreStep = msg.text

            increaseCurrentChatStep(chatId)
            return
    }

    const user = msg.from
    const userName = `${user.first_name} ${user.last_name}`

    await bot.sendMessage(chatId, 'Спасибо большое!')
    await sendToCommonChannel(`@${user.username} - ${userName} прошел опрос.`)

    console.log(chats[chatId])
})

bot.on('callback_query', async ({ data, message }) => {
    const opts = {
        chat_id: message.chat.id,
        message_id: message.message_id,
    }

    if (data === 'firstStep-yes') {
        await bot.editMessageText('Ваш ответ записан.', opts)

        // chats[chatId].firstStep = chats[chatId].currentMessage
    }

    if (data === 'firstStep-no') {
        await bot.editMessageText('Введите ответ еще раз.', opts)
    }
})

const startBot = () =>
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id

        chats[chatId] = {
            steps: 0,
            firstStep: 'init',
            secondStep: 'init',
            thirdStep: 'init',
            foreStep: 'init',
        }

        await greeting(chatId)
        // await sendToCommonChannel(
        //     `@${user.username} - ${userName} запустил бота.`
        // )
    })

module.exports = { startBot }
