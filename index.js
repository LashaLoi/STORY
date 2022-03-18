import http from 'http'
import { startBot } from './src/core.js'

startBot()

console.log(`Bot has been started!`)

const server = http.createServer((req, res) => {
    res.end('Vercel server')
})

server.listen(8080, () =>
    console.log('Server started on http://localhost:8080')
)
