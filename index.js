import http from 'http'
import './src/core.js'

console.log(`Bot has been started!`)

const server = http.createServer((_req, res) => {
  res.end('Vercel server')
})

server.listen(8080, () =>
  console.log('Server started on http://localhost:8080')
)
