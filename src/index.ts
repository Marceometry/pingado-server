import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import { game } from './game'

const CLIENT_LOCAL_URL = 'http://localhost:5173'
const CLIENT_PROD_URL = 'https://pingado.vercel.app'
const origin = '*' // [CLIENT_LOCAL_URL, CLIENT_PROD_URL]

const app = express()
app.use(express.json())
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin },
})

game(io)

server.listen(8080, () => console.log('\nServer is running!\n'))
