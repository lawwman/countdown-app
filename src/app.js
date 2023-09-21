import express from "express"
import http from "http"
import path, { dirname } from "path"
import { Server } from "socket.io"
import { fileURLToPath } from "url";
import { IP, PORT } from "./config.js"
import { doesRoomExist } from './utils.js'
import { makeNewRoom } from '../public/make-room.js'

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
//   msg: 'test aosidfjn asodjf paso dfjpsdofjapsodfjapsodfk ps odfk apsodfkapsdofkapdosk fpasodkf psodkf po sdkfps kfpasodkfpoasdf test aosidfjn asodjf paso dfjpsdofjapsodfjapsodfk ps odfk apsodfkapsdofkapdosk fpasodkf psodkf po sdkfps kfpasodkfpoasdf test aosidfjn end',
//   description: 'test room',
//   originalCd: 0,
// }}

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

let rooms = {}

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

  if (doesRoomExist(data.roomId, rooms)) {
    delete rooms[data.roomId]
    io.in(data.roomId).disconnectSockets(true);
    io.to('admin').emit('delete-room', data.roomId, data.sourceSocketId)
    res.end()
  } else {
    res.end() // maybe should throw error
  }
})

app.get('/sync-rooms', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rooms));
})

app.get('/room', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'room.html'));
})

app.get('/invalid-room', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'invalid-room.html'));
})

app.get('/room-info', (req, res) => {
  const roomId = req.query['id']

  if (roomId === 'null' || roomId === '') {
    /* bad scenarios occur when query parameter is not defined:
    1. "/room?id="
    2. "/room"
    in such scenarios, a room cannot be created if even roomId is not valid
    */
    res.status(400).send()
    return
  }

  /* if room does not exist but roomId is valid, make a new room */
  if (!doesRoomExist(roomId, rooms)) {
    const newRoom = makeNewRoom('')
    rooms[roomId] = newRoom // add new room to rooms
    io.to('admin').emit('add-room', roomId, newRoom, 'id that does not exist') // broadcast to admin pages that new room is created
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rooms[roomId]));
})

app.post('/toggle-room', (req, res) => {
  const data = req.body;
  if ('roomId' in data && 'room' in data) {
    if (doesRoomExist(data.roomId, rooms)) {
      rooms[data.roomId] = data.room
      io.to(data.roomId).emit('toggle-room', data.room)
      io.to('admin').emit('toggle-room', data.roomId, data.room, data.sourceSocketId)
    }
  }
  res.end()
})

io.on('connection', (socket) => {
  console.log(`Incoming socket connection from: ${socket.handshake.address}`)

  socket.on('join-room', (roomId) => {
    socket.join(roomId)
  })

  socket.on('join-admin-room', () => {
    socket.join('admin')
  })
});

server.listen(PORT, IP, () => {
  console.log(`⚡️[server]: Server is running at http://${IP}:${PORT}`);
});
