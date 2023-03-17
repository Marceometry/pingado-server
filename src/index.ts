import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import { game } from './game'

const CLIENT_URL = 'https://pingado.vercel.app'

const app = express()
app.use(express.json())
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'https://pingado.vercel.app'] },
})

game(io)

server.listen(8080, () => console.log('Server is running!'))
