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
  console.log('syncing rooms...')
  rooms = req.body;
  res.end();
  console.log('done syncing rooms.');
});

app.get('/room', (req, res) => {
  const roomId = parseRoomId(req.query['id'], rooms);
  if (roomId === undefined) res.sendFile(path.join(PUBLIC_DIR, 'room-not-found.html'));
  else res.sendFile(path.join(PUBLIC_DIR, 'room.html'));
})

app.get('/room-info', (req, res) => {
  const roomId = parseRoomId(req.query['id'], rooms);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rooms[roomId]));
})

app.post('/toggle-countdown', (req, res) => {
  const data = req.body;
  if ('roomId' in data && 'room' in data) {
    const roomId = parseRoomId(data['roomId'], rooms)
    if (roomId && isValidInstruction(data.room.latestInstruction)) {
      console.log(`${data.room.latestInstruction} room ${roomId}`)
      rooms[roomId] = data.room
      io.to(roomId).emit(data.room.latestInstruction)
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
