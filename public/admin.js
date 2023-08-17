/* TODO:
- admin should detect when lost connection (backend down or lost internet connection). display accordingly
- error handling dont show on ui
- able to name rooms
- Copy to clipboard function for url
*/

/*
instructions:
 - start, pause is as expected. no new countdown value
 - set means to clear all countdown progress and not start. may have new countdown value
 - restart means to clear all countdown progress and start. no new countdown value
*/

import {
    pauseStartOrRestartRoom,
    updateRoom,
    makeNewRoom,
    isUserCdInputValid,
    getSelectedRoomId,
    sumMinsAndSeconds
} from "./admin.utils.js"

import {
    uiUpdateRoomUnSelected,
    uiUpdateRoomSelected,
    updateAllRoomsCdLeft,
    addRoomDiv,
    isUserFormInputUpdated,
} from "./admin.ui.js"

uiUpdateRoomUnSelected() // start unselected

/* setup event listeners for the control panel */
document.getElementById(`select-room-form`).addEventListener('submit', async (event) => {
    event.preventDefault();
});

document.getElementById(`select-room-form`).addEventListener('input', async (_event) => {
    const formUpdated = isUserFormInputUpdated(rooms[getSelectedRoomId()])
    document.getElementById('update-room-btn').disabled = !formUpdated
    document.getElementById('discard-form-changes').disabled = !formUpdated
});

document.getElementById(`set-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`set-room-cd-min-input`).value = document.getElementById(`set-room-dropdown`).value
});

document.getElementById(`new-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`new-room-cd-min-input`).value = document.getElementById(`new-room-dropdown`).value
});

document.getElementById(`new-room-form`).addEventListener('submit', (event) => {
    event.preventDefault();
});

document.getElementById(`new-room-cd-min-input`).addEventListener('input', (event) => {
    document.getElementById('add-room').disabled = !isUserCdInputValid(event.target.value)
})
document.getElementById(`new-room-cd-s-input`).addEventListener('input', (event) => {
    document.getElementById('add-room').disabled = !isUserCdInputValid(event.target.value)
})

document.getElementById('add-room').addEventListener('click', () => addRoom())
document.getElementById('start-pause-cd').addEventListener('click', () => sendCdInstructionToRoom(getSelectedRoomId(), document.getElementById('start-pause-instr').textContent))
document.getElementById('restart-cd').addEventListener('click', () => sendCdInstructionToRoom(getSelectedRoomId(), 'restart'))
document.getElementById('update-room-btn').addEventListener('click', async () => {
    const roomId = getSelectedRoomId()
    const room = updateRoom(rooms, roomId)
    await toggleRoom(roomId, room)
})
document.getElementById('discard-form-changes').addEventListener('click', () => uiUpdateRoomSelected(getSelectedRoomId(), rooms))

let roomCounter = 0
let rooms = {}

setInterval(() => updateAllRoomsCdLeft(rooms), 500)

async function toggleRoom(roomId, room) {
    console.log(room)
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
    const newRoomId = `${roomCounter}`
    roomCounter += 1

    const countdown = sumMinsAndSeconds(
        parseInt(document.getElementById(`new-room-cd-min-input`).value),
        parseInt(document.getElementById(`new-room-cd-s-input`).value)
    )

    rooms[newRoomId] = makeNewRoom(countdown);
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
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

void init()