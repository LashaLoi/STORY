import { interpret } from 'xstate'
import { START_COMMAND } from './constants.js'
import { pollMachine } from './machine/pollMachine.js'
import { stateMap } from './store/state.js'
import { bot } from './config/bot.js'

bot.on('message', ({ chat, text }) => {
  if (text === START_COMMAND) return

  const chatId = chat.id
  const state = stateMap.get(chatId)

  return state
    ? state.service.send('NEXT', { message: text })
    : bot.sendMessage(chatId, 'Чтобы начать введите команду /start')
})

bot.onText(/\/start/, ({ chat, from }) => {
  const { id: chatId } = chat

  const {
    username,
    first_name: firstName = '',
    last_name: lastName = '',
  } = from

  const service = interpret(pollMachine).start()

  service.send('START', {
    username,
    firstName,
    lastName,
    chatId,
  })

  stateMap.set(chatId, {
    service,
  })
})
