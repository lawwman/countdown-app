import express from "express"
import http from "http"
import path, { dirname } from "path"
import { Server } from "socket.io"
import { fileURLToPath } from "url";
import { IP, PORT } from "./config.js"
import { parseRoomId, isValidInstruction } from './utils.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// let rooms = {"1": {
//   startEpoch: 0,
//   countdownOnly: false,
//   pauseBuffer: 0,
//   countdown: 0,
//   instruction: 'set',
//   msg: '',
// }}

let rooms = {}

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

app.use(express.static((PUBLIC_DIR)));
app.use(express.json());

app.get('/', (req, res) => {
  console.log(`Incoming http request from: ${req.ip}`)
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// sync the rooms body
app.post('/sync-rooms', (req, res) => {
  rooms = req.body;
  res.end();
});

app.get('/sync-rooms', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rooms));
})

app.get('/room', (req, res) => {
  const roomId = parseRoomId(req.query['id'], rooms);
  if (roomId === undefined) res.sendFile(path.join(PUBLIC_DIR, 'room-not-found.html'));
  else res.sendFile(path.join(PUBLIC_DIR, 'room.html'));
})

app.get('/room-info', (req, res) => {
  const roomId = parseRoomId(req.query['id'], rooms);
  if (roomId === undefined) {
    res.status(400).send()
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(rooms[roomId]));
  }
})

app.post('/toggle-room', (req, res) => {
  const data = req.body;
  if ('roomId' in data && 'room' in data) {
    const roomId = parseRoomId(data['roomId'], rooms)
    if (roomId !== undefined && isValidInstruction(data.room.instruction)) {
      console.log(`${data.room.instruction} room ${roomId}`)
      rooms[roomId] = data.room
      io.to(roomId).emit('toggle-room', data.room)
    }
  }
  res.end()
})

io.on('connection', (socket) => {
  console.log(`Incoming socket connection from: ${socket.handshake.address}`)

  socket.on('join-room', (roomId) => {
    console.log(`joining room: ${roomId}`)
    socket.join(roomId)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, IP, () => {
  console.log(`⚡️[server]: Server is running at http://${IP}:${PORT}`);
});
