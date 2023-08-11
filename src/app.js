import express from "express"
import http from "http"
import path, { dirname } from "path"
import { Server } from "socket.io"
import { fileURLToPath } from "url";
import { IP, PORT } from "./config.js"
import { parseQueryParamForRoomId } from './utils.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let rooms = { '0': { countdown: '23' } }

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
  const roomId = parseQueryParamForRoomId(req.query, rooms);
  if (roomId === undefined) res.sendFile(path.join(PUBLIC_DIR, 'room-not-found.html'));
  else res.sendFile(path.join(PUBLIC_DIR, 'room.html'));
})

app.get('/room-info', (req, res) => {
  const roomId = parseQueryParamForRoomId(req.query, rooms);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rooms[roomId]));
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
