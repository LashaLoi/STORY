import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const url = process.env.API_URL

export const handleRequest = async (chatId, chat) => {
    const { username } = chat

    const { data } = await axios.get(url)
    const user = data.find((item) => item.username === username)

    if (user) {
        return axios.put(`${url}/${user.id}`, chat)
    }

    return axios.post(url, chat)
}
