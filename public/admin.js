/* TODO:
- select room form:
 - url send to clipboard.
 - make it obvious what room im on.

 - longer message. potentially paragraphs

 better way to come up with room Id. dont want number to go so big.
 limit number of rooms.

disable buttons when loading. async nature takes a while

- add room:
 - room description
*/

/*
instructions:
 - start, pause is as expected. no new countdown value
 - set means to clear all countdown progress and not start. may have new countdown value
 - restart means to clear all countdown progress and start. no new countdown value
*/

import {
    pauseStartOrRestartRoom,
    makeNewRoom,
    getSelectedRoomId,
    setRoom,
} from "./admin.utils.js"

import {
    uiUpdateRoomUnSelected,
    uiUpdateRoomSelected,
    updateAllRoomsCdLeft,
    addRoomDiv,
    isCountdownUpdatedFn,
    deleteRoomDiv
} from "./admin.ui.js"

import {
    calculateTimeLeftInt
} from "./countdown.utils.js"

uiUpdateRoomUnSelected() // start unselected


document.getElementById('set-msg-form').addEventListener('submit', async (event) => {
    event.preventDefault();
});

document.getElementById('send-msg-input').addEventListener('input', async () => {
    // todo: some sanitisation here maybe
    // if not change, dont enable button
});

document.getElementById('clear-msg-btn').addEventListener('click', async () => {
    await sendMsg('')
});

document.getElementById('send-msg-btn').addEventListener('click', async () => {
    await sendMsg(document.getElementById('send-msg-input').value)
});

document.getElementById('set-countdown-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const minutes = parseInt(document.getElementById(`set-room-cd-min-input`).value)
    const seconds = parseInt(document.getElementById(`set-room-cd-s-input`).value)

    const countdown = minutes * 60 + seconds
    const room = setRoom(rooms, countdown)
    await toggleRoom(roomId, room)
});

document.getElementById('set-countdown-form').addEventListener('input', async () => {
    document.getElementById('set-cd-btn').disabled = !isCountdownUpdatedFn(rooms[getSelectedRoomId()])
});

document.getElementById('cd-only').addEventListener('click', async () => {
    const roomId = getSelectedRoomId()
    const room = JSON.parse(JSON.stringify(rooms[roomId]))
    room.countdownOnly = !room.countdownOnly
    await toggleRoom(getSelectedRoomId(), room)
})

document.getElementById(`set-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`set-room-cd-min-input`).value = document.getElementById(`set-room-dropdown`).value
    document.getElementById('set-cd-btn').disabled = !isCountdownUpdatedFn(rooms[getSelectedRoomId()])
});

document.getElementById('start-pause-cd').addEventListener('click', () => sendCdInstructionToRoom(getSelectedRoomId(), document.getElementById('start-pause-instr').textContent))
document.getElementById('restart-cd').addEventListener('click', () => sendCdInstructionToRoom(getSelectedRoomId(), 'restart'))

document.getElementById('extend-1-min').addEventListener('click', async () => await extendTime(1))
document.getElementById('extend-5-min').addEventListener('click', async () => await extendTime(5))
document.getElementById('extend-10-min').addEventListener('click', async () => await extendTime(10))

document.getElementById('delete-room-btn').addEventListener('click', async () => {
    try {
        const res = await fetch('delete-room', {
            method: 'POST',
            body: JSON.stringify({ roomId: getSelectedRoomId() }),
            headers: { "Content-Type": "application/json" },
        })
        if (res.status !== 200) {
            console.log('fail to start room....') // bad response from backend
            console.log(await res.text())
            return
        }

        const roomId = getSelectedRoomId()
        delete rooms[roomId]
        uiUpdateRoomUnSelected()
        deleteRoomDiv(roomId)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
})



document.getElementById(`new-room-form`).addEventListener('submit', (event) => {
    event.preventDefault();
    addRoom();
});

/* ensure unique rooms */
document.getElementById(`new-room-name`).addEventListener('input', async (_event) => {
    document.getElementById('add-room').disabled = document.getElementById(`new-room-name`).value in rooms
});

let roomCounter = 0
let rooms = {}

let interval;

async function sendMsg(msg) {
    const roomId = getSelectedRoomId()
    const room = JSON.parse(JSON.stringify(rooms[roomId]))
    room.msg = msg
    await toggleRoom(roomId, room)
}

async function extendTime(extendPeriod) {
    const roomId = getSelectedRoomId()

    if (rooms[roomId].instruction === 'set') {
        const timeLeft = parseInt(calculateTimeLeftInt(rooms[roomId].countdown, rooms[roomId].pauseBuffer, rooms[roomId].startEpoch, rooms[roomId].startEpoch))
        console.log(timeLeft)
        const room = setRoom(rooms, timeLeft + extendPeriod * 60)
        await toggleRoom(roomId, room)
    } else if (rooms[roomId].instruction === 'pause') {
        const timeLeft = parseInt(calculateTimeLeftInt(rooms[roomId].countdown, rooms[roomId].pauseBuffer, rooms[roomId].startEpoch, rooms[roomId].pauseEpoch))
        console.log(timeLeft)
        const room = setRoom(rooms, timeLeft + extendPeriod * 60)
        await toggleRoom(roomId, room)
    }
    else {
        const timeLeft = parseInt(calculateTimeLeftInt(rooms[roomId].countdown, rooms[roomId].pauseBuffer, rooms[roomId].startEpoch, Date.now()))
        const room = JSON.parse(JSON.stringify(rooms[roomId]))
        room.countdown = timeLeft + extendPeriod * 60
        room.startEpoch = Date.now()
        room.pauseEpoch = undefined
        room.pauseBuffer = 0
        await toggleRoom(roomId, room)
    }
}

async function toggleRoom(roomId, room) {
    try {
        const res = await fetch('toggle-room', {
            method: 'POST',
            body: JSON.stringify({ roomId, room }),
            headers: { "Content-Type": "application/json" },
        })
        if (res.status !== 200) {
            console.log('fail to start room....') // bad response from backend
            console.log(await res.text())
            return
        }
        rooms[roomId] = room // all good, add the room
        uiUpdateRoomSelected(roomId, rooms)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

async function sendCdInstructionToRoom(roomId, instruction) {
    const room = pauseStartOrRestartRoom(rooms, roomId, instruction)
    await toggleRoom(roomId, room)
}

async function addRoom() {
    const newRoomId = document.getElementById('new-room-name').value
    const countdown = 0

    rooms[newRoomId] = makeNewRoom(countdown);
    console.log(rooms)
    try {
        const res = await fetch('sync-rooms', {
            method: 'POST',
            body: JSON.stringify(rooms),
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (res.status !== 200) {
            console.log('fail to add room....') // bad response from backend
            console.log(await res.text())
            delete rooms[newRoomId]
            return
        }
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        delete rooms[newRoomId]
        return
    }
    addRoomDiv(newRoomId, rooms)
    roomCounter += 1
    document.getElementById('new-room-name').value = roomCounter
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
        roomCounter = Object.keys(rooms).length + 1
        document.getElementById('new-room-name').value = roomCounter
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

let socket;
socket = io('')

socket.on("connect", async () => {
    await init()
    const status = document.getElementById('status')
    status.textContent = "connected"
    status.classList.remove("error")
    document.getElementById("add-room").disabled = false
    interval = setInterval(() => updateAllRoomsCdLeft(rooms), 500)
});

socket.on('disconnect', () => {
    if (interval) clearInterval(interval);
    document.getElementById("room-holder").innerHTML = ''
    uiUpdateRoomUnSelected()
    document.getElementById("add-room").disabled = true
    const status = document.getElementById('status')
    status.textContent = "disconnected, attempting to reconnect"
    status.classList.add("error")
    
})