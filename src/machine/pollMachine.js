import { createMachine, assign } from 'xstate'

import { sendToBot, sendData } from '../api.js'
import { stateMap } from '../store/state.js'
import { bot } from '../config/bot.js'

export const pollMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbdA6A7gQwEsAXAgOygDFUAnAZSL2qIGIAlAUVoBUBBVrgNoAGALqIUqWMQKpS4kAA9EANgDsWACzKNADgDMygJwBGQwCYzW4wBoQAT0Q7jmw6+V6dAViN7PrgL7+tmiYuIQk5FR0DEzMAHLsABqCovJoUiSy8koIZsZ6WO5mTn6exsY6qrYOCMZ+mqrKnp4aQr46aqqBwRjYAGYE1LBEAIoArnCZpPFJKWJIIOnSWQs5GqoamhqeekKGykKNlcYa1Yh1hg1NLW2eHapdQYu9WLBgAMayEOOTMtMJyWE8wkGT+2UQqnqemMlkMGg0em2eWUZ1q9XW11a7U63WeoSIAAtBt8JsM-jNAakFkspuDakJLFhVMY9r5lMoKjovKiLldmli7jiniF+jQwD8ybIKXM0pJlnJVudip4sG1DEJTJV1VoqvZzujGvzbvdHj1QgMAG7i0lTaVA2WglagHJ1BFYPJ7MyGRHKMwavQ8g2Y41Cp6kVAQOCyzAO+V0gC0Nj1CHjylxIrC0kiNHojCIsdpioQ6x5OjMWEMO0OliaFUhprx-UGwwlhZBcaLejMKrMiL0qgMXmKHQDyYq5cru1UNbKlU8DYzb0+pBJvydz0dCudiEFqq090RxlUXJRY7LFar060s-r6ZehOJrbB1LlbcUjlUQgrJyEnmRHV7JManHC8pxnOt5zvc0xSfdcaWfbdanyZQsGhSxPEOGFDH0XVgPPSdq2vCCFxeS1rTXLcNw7RD8n2QpWl9Bl9ldHRSwnS9wLnEjzTIAhYAJAsEPfWomk2Jxuy9Ro9F2cxAx0d02kOMoPTqHQNECQIgA */
  id: 'poll',
  predictableActionArguments: true,
  initial: 'waitingForStart',
  context: {
    chatId: null,
    username: null,
    firstName: null,
    lastName: null,
    firstQuestion: null,
    secondQuestion: null,
    thirdQuestion: null,
    foreQuestion: null,
    fiveQuestion: null,
  },
  states: {
    waitingForStart: {
      on: {
        START: {
          target: 'firstQuestion',
          actions: [
            assign((_, event) => ({
              username: event.username,
              firstName: event.firstName,
              lastName: event.lastName,
              chatId: event.chatId,
            })),
            (_, event) => sendToBot(event.chatId, 'firstQuestion'),
          ],
        },
      },
    },
    firstQuestion: {
      on: {
        NEXT: {
          target: 'secondQuestion',
          actions: [
            assign((_, event) => ({
              firstQuestion: event.message,
            })),
            async (context, event) => {
              await bot.sendMessage(
                context.chatId,
                `Приятно познакомиться, ${event.message}`
              )

              sendToBot(context.chatId, 'secondQuestion')
            },
          ],
        },
      },
    },
    secondQuestion: {
      on: {
        NEXT: {
          target: 'thirdQuestion',
          actions: [
            assign((_, event) => ({
              secondQuestion: event.message,
            })),
            (context) => sendToBot(context.chatId, 'thirdQuestion'),
          ],
        },
      },
    },
    thirdQuestion: {
      on: {
        NEXT: {
          target: 'foreQuestion',
          actions: [
            assign((_, event) => ({
              thirdQuestion: event.message,
            })),
            (context) => sendToBot(context.chatId, 'foreQuestion'),
          ],
        },
      },
    },
    foreQuestion: {
      on: {
        NEXT: {
          target: 'fiveQuestion',
          actions: [
            assign((_, event) => ({
              foreQuestion: event.message,
            })),
            (context) => sendToBot(context.chatId, 'fiveQuestion'),
          ],
        },
      },
    },
    fiveQuestion: {
      on: {
        NEXT: {
          target: 'finish',
          actions: [
            assign((_, event) => ({
              fiveQuestion: event.message,
            })),
            (context) => {
              bot.sendMessage(
                context.chatId,
                `Спасибо за твои ответы, ${context.firstQuestion}! Классно, что ты сегодня с нами!.\n\n` +
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
            },
          ],
        },
      },
    },
    finish: {
      entry: async (context) => {
        console.log('FINISH', context)

        await sendData(context)

        stateMap.delete(context.chatId)
      },
      type: 'final',
    },
  },
})
