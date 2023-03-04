import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'

const CLIENT_URL = 'http://localhost:5173'

const app = express()
app.use(express.json())
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log('connected', socket.id)
})

server.listen(8080, () => console.log('Server is running!'))
