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
    getNewUniqueRoomId
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

const wordCount = document.getElementById('word-count')
document.getElementById('send-msg-input').addEventListener('input', async () => {
    const userInput = document.getElementById('send-msg-input').value
    const noMsg = userInput.length <= 0
    const sameMsgAsCurrent = userInput === rooms[getSelectedRoomId()].msg
    wordCount.textContent = userInput.length
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

document.getElementById('delete-room-btn').addEventListener('click', async () => {
    document.getElementById('delete-room-btn').disabled = true
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



document.getElementById(`new-room-form`).addEventListener('submit', async (event) => {
    event.preventDefault();
    for (const element of document.getElementById(`new-room-form`).elements) {
        element.disabled = true
    }
    await addRoom();

    for (const element of document.getElementById(`new-room-form`).elements) {
        element.disabled = false
    }
});

/* ensure unique rooms */
document.getElementById(`new-room-name`).addEventListener('input', async (_event) => {
    document.getElementById('add-room').disabled = document.getElementById(`new-room-name`).value in rooms
});

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
    if (Object.keys(rooms).length >= 20) {
        alert('too many rooms')
        return;
    }

    const newRoomId = document.getElementById('new-room-name').value
    const countdown = 0

    rooms[newRoomId] = makeNewRoom(countdown, document.getElementById('new-room-description').value);
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
    document.getElementById('new-room-name').value = getNewUniqueRoomId(rooms)
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