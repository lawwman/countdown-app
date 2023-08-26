/*
instructions:
 - start, pause is as expected. no new countdown value
 - set means to clear all countdown progress and not start. may have new countdown value
 - restart means to clear all countdown progress and start. no new countdown value
*/

import {
    startRoom,
    pauseRoom,
    restartRoom,
    setRoomCdKeepInstruction,
    makeNewRoom,
    getSelectedRoomId,
    setRoom,
    getNewUniqueRoomId,
    cloneSelectedRoom
} from "./admin.utils.js"

import {
    uiUpdateRoomUnSelected,
    updateAllRoomsCdLeft,
    addRoomDiv,
    isCountdownUpdatedFn,
    deleteRoomDiv
} from "./admin.ui.js"

import {
    toggleRoomApi,
    deleteRoomApi,
    addRoomApi
} from "./admin.api.js"

import {
    calculateTimeLeftInt
} from "./countdown.utils.js"

uiUpdateRoomUnSelected() // start unselected

document.getElementById('url-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('selected-room-url').textContent);
    document.getElementById('url-tooltip').textContent = 'copied'
})

document.getElementById('url-copy').addEventListener('mouseout', () => {
    document.getElementById('url-tooltip').textContent = 'copy to clipboard'
})

document.getElementById('set-msg-form').addEventListener('submit', async (event) => {
    event.preventDefault();
});

document.getElementById('send-msg-input').addEventListener('input', async () => {
    const userInput = document.getElementById('send-msg-input').value
    const noMsg = userInput.length <= 0
    const sameMsgAsCurrent = userInput === rooms[getSelectedRoomId()].msg
    document.getElementById('word-count').textContent = userInput.length
    document.getElementById('send-msg-btn').disabled = noMsg || sameMsgAsCurrent
});

document.getElementById('clear-msg-btn').addEventListener('click', async () => {
    await sendMsg('')
});

document.getElementById('send-msg-btn').addEventListener('click', async () => {
    await sendMsg(document.getElementById('send-msg-input').value)
});

document.getElementById('set-countdown-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await setTime()
});

document.getElementById('set-countdown-form').addEventListener('input', async () => {
    document.getElementById('set-cd-btn').disabled = !isCountdownUpdatedFn(rooms[getSelectedRoomId()])
});

document.getElementById('cd-only').addEventListener('click', async () => {
    const { roomId, room } = cloneSelectedRoom(rooms)
    room.countdownOnly = !room.countdownOnly
    await toggleRoomApi(roomId, room, socket.id, rooms)
})

document.getElementById(`set-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`set-room-cd-min-input`).value = document.getElementById(`set-room-dropdown`).value
    document.getElementById('set-cd-btn').disabled = !isCountdownUpdatedFn(rooms[getSelectedRoomId()])
});

document.getElementById('start-pause-cd').addEventListener('click', async () => {
    let { roomId, room } = cloneSelectedRoom(rooms)
    if (document.getElementById('start-pause-instr').textContent === 'start') room = startRoom(room)
    else room = pauseRoom(room)
    await toggleRoomApi(roomId, room, socket.id, rooms)
})
document.getElementById('restart-cd').addEventListener('click', async () => {
    let { roomId, room } = cloneSelectedRoom(rooms)
    room = restartRoom(room)
    await toggleRoomApi(roomId, room, socket.id, rooms)
})

document.getElementById('extend-1-min').addEventListener('click', async () => {
    document.getElementById('extend-1-min').disabled = true
    await extendTime(1)
    document.getElementById('extend-1-min').disabled = false
})
document.getElementById('extend-5-min').addEventListener('click', async () => {
    document.getElementById('extend-5-min').disabled = true
    await extendTime(5)
    document.getElementById('extend-5-min').disabled = false
})
document.getElementById('extend-10-min').addEventListener('click', async () => {
    document.getElementById('extend-10-min').disabled = true
    await extendTime(10)
    document.getElementById('extend-10-min').disabled = false
})

document.getElementById('delete-room-btn').addEventListener('click', async () => await deleteRoomApi(getSelectedRoomId(), rooms, socket.id))



document.getElementById(`new-room-form`).addEventListener('submit', async (event) => {
    event.preventDefault();
    const elements = document.getElementById(`new-room-form`).elements
    elements.map(element => element.disabled = true)
    await addRoom();
    elements.map(element => element.disabled = false)
});

/* ensure unique rooms */
document.getElementById(`new-room-name`).addEventListener('input', async (_event) => {
    document.getElementById('add-room').disabled = document.getElementById(`new-room-name`).value in rooms
});

let rooms = {}

let interval;

async function sendMsg(msg) {
    const { roomId, room } = cloneSelectedRoom(rooms)
    room.msg = msg
    await toggleRoomApi(roomId, room, socket.id, rooms)
}

async function setTime() {
    let { roomId, room } = cloneSelectedRoom(rooms)
    const minutes = parseInt(document.getElementById(`set-room-cd-min-input`).value)
    const seconds = parseInt(document.getElementById(`set-room-cd-s-input`).value)
    const countdown = minutes * 60 + seconds

    if (room.instruction === 'set' || room.instruction === 'pause') {
        room = setRoom(room, countdown)
    } else {
        room.countdown = countdown
        room.startEpoch = Date.now()
        room.pauseEpoch = undefined
        room.pauseBuffer = 0
    }
    await toggleRoomApi(roomId, room, socket.id, rooms)
}

async function extendTime(extendPeriod) {
    let { roomId, room } = cloneSelectedRoom(rooms)

    if (room.instruction === 'set' || room.instruction === 'pause') {
        const currentEpoch = room.instruction === 'set' ? room.startEpoch : room.pauseEpoch
        const timeLeft = parseInt(calculateTimeLeftInt(room.countdown, room.pauseBuffer, room.startEpoch, currentEpoch))
        room = setRoom(room, timeLeft + extendPeriod * 60)
    } else {
        const timeLeft = parseInt(calculateTimeLeftInt(room.countdown, room.pauseBuffer, room.startEpoch, Date.now()))
        room.countdown = timeLeft + extendPeriod * 60
        room.startEpoch = Date.now()
        room.pauseEpoch = undefined
        room.pauseBuffer = 0
    }
    await toggleRoomApi(roomId, room, socket.id, rooms)
}

async function addRoom() {
    if (Object.keys(rooms).length >= 20) {
        alert('too many rooms')
        return;
    }

    const newRoomId = document.getElementById('new-room-name').value
    const countdown = 0

    const room = makeNewRoom(countdown, document.getElementById('new-room-description').value);
    await addRoomApi(newRoomId, room, rooms, socket.id)
}

async function init() {
    try {
        const res = await fetch('sync-rooms', {
            method: 'GET',
        })
        if (res.status !== 200) {
            console.log('fail to init rooms....') // bad response from backend
            console.log(await res.text())
            return
        }
        rooms = await res.json()
        Object.keys(rooms).map(roomId => addRoomDiv(roomId, rooms))
        document.getElementById('new-room-name').value = getNewUniqueRoomId(rooms)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

let socket;
socket = io('')

socket.on("connect", async () => {
    socket.emit('join-admin-room')
    await init()
    const status = document.getElementById('status')
    status.textContent = "connected"
    status.classList.remove("error")
    document.getElementById("add-room").disabled = false
    interval = setInterval(() => updateAllRoomsCdLeft(rooms), 500)
});

socket.on("add-room", async (roomId, room, sourceSocketId) => {
    if (socket.id === sourceSocketId) return;
    rooms[roomId] = room
    addRoomDiv(roomId, rooms)
})

socket.on("delete-room", async (roomId, sourceSocketId) => {
    if (socket.id === sourceSocketId) return;
    delete rooms[roomId]
    
    if (getSelectedRoomId() === roomId) uiUpdateRoomUnSelected()
    deleteRoomDiv(roomId)
})

socket.on("toggle-room", async (roomId, room, sourceSocketId) => {
    if (socket.id === sourceSocketId) return;
    rooms[roomId] = room
    if (getSelectedRoomId() === roomId) uiUpdateRoomUnSelected()
})


socket.on('disconnect', () => {
    if (interval) clearInterval(interval);
    document.getElementById("room-holder").innerHTML = ''
    uiUpdateRoomUnSelected()
    document.getElementById("add-room").disabled = true
    const status = document.getElementById('status')
    status.textContent = "disconnected, attempting to reconnect"
    status.classList.add("error")  
})