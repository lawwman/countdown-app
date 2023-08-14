/* TODO:
- room ui ux
- show countdown only / show all
- room should detect when lost connection (backend down). display accordingly
- admin should detect when lost connection (backend down). display accordingly
- error handling dont show on ui
- able to name rooms
- css update
*/

/*
instructions:
 - start, pause is as expected. no new countdown value
 - set means to clear all countdown progress and not start. may have new countdown value
 - restart means to clear all countdown progress and start. no new countdown value
*/

import {
    withInstructionMakeRoom,
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
    isUserFormInputUpdated
} from "./admin.ui.js"

uiUpdateRoomUnSelected() // start unselected

function updateRoomBtn() {
    const formUpdated = isUserFormInputUpdated(rooms[getSelectedRoomId()])
    document.getElementById('update-room-btn').disabled = !formUpdated
    document.getElementById('discard-form-changes').disabled = !formUpdated
}

/* setup event listeners for the control panel */
document.getElementById(`select-room-form`).addEventListener('submit', async (event) => {
    event.preventDefault();
});

document.getElementById(`select-room-form`).addEventListener('input', async (_event) => {
    updateRoomBtn();
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

document.getElementById('add-room').addEventListener('click', () => addRoomHandler())
document.getElementById('start-pause-cd').addEventListener('click', () => sendInstructionToRoom(getSelectedRoomId(), document.getElementById('start-pause-instr').textContent))
document.getElementById('restart-cd').addEventListener('click', () => sendInstructionToRoom(getSelectedRoomId(), 'restart'))
document.getElementById('update-room-btn').addEventListener('click', () => updateRoom(getSelectedRoomId()))
document.getElementById('discard-form-changes').addEventListener('click', () => uiUpdateRoomSelected(getSelectedRoomId(), rooms))

let roomCounter = 0
let rooms = {}

setInterval(() => updateAllRoomsCdLeft(rooms), 500)


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

async function updateRoom(roomId) {
    const room = withInstructionMakeRoom(rooms, roomId, 'set')
    room.msg = document.getElementById('send-msg').value
    room.countdownOnly = document.getElementById('cd-only-checkbox').checked
    await toggleRoom(roomId, room)
}

async function sendInstructionToRoom(roomId, instruction) {
    const room = withInstructionMakeRoom(rooms, roomId, instruction) // by reference
    await toggleRoom(roomId, room)
}

async function addRoomHandler() {
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