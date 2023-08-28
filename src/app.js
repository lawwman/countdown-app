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

let rooms = {"1": {
  startEpoch: 0,
  countdownOnly: false,
  pauseBuffer: 0,
  countdown: 0,
  instruction: 'set',
  msg: 'test aosidfjn asodjf paso dfjpsdofjapsodfjapsodfk ps odfk apsodfkapsdofkapdosk fpasodkf psodkf po sdkfps kfpasodkfpoasdf test aosidfjn asodjf paso dfjpsdofjapsodfjapsodfk ps odfk apsodfkapsdofkapdosk fpasodkf psodkf po sdkfps kfpasodkfpoasdf test aosidfjn end',
  description: 'test room',
  originalCd: 0,
}}

// let rooms = {"1": {
//   startEpoch: 0,
//   countdownOnly: false,
//   pauseBuffer: 0,
//   countdown: 0,
//   instruction: 'set',
//   msg: 'test',
//   description: '',
//   originalCd: 0,
// }}

// let rooms = {}

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

app.use(express.static((PUBLIC_DIR)));
app.use(express.json());

app.get('/', (req, res) => {
  console.log(`Incoming http request from: ${req.ip}`)
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.post('/add-room', (req, res) => {
  const { roomId, room, sourceSocketId } = req.body;
  rooms[roomId] = room;
  io.to('admin').emit('add-room', roomId, room, sourceSocketId)
  res.end();
})

app.post('/delete-room', (req, res) => {
  const data = req.body;
  const roomId = parseRoomId(data.roomId, rooms);
  if (roomId === undefined) {
    res.end() // maybe should throw error
  } else {
    delete rooms[roomId]
    io.in(roomId).disconnectSockets(true);
    io.to('admin').emit('delete-room', roomId, data.sourceSocketId)
    res.end()
  }
})

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
      io.to('admin').emit('toggle-room', roomId, data.room, data.sourceSocketId)
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

  socket.on('join-admin-room', () => {
    console.log(`joining admin room`)
    socket.join('admin')
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, IP, () => {
  console.log(`⚡️[server]: Server is running at http://${IP}:${PORT}`);
});
