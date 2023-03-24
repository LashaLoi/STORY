import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

const token = process.env.TG_TOKEN

export const bot = new TelegramBot(token, { polling: true })
