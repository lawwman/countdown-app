/* TODO:
- select between units / mins or seconds. currently is second
- send msg
- show countdown only / show all
- room should detect when lost connection (backend down). display accordingly
- admin should detect when lost connection (backend down). display accordingly
- error handling dont show on ui
- able to name rooms
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
} from "./admin.utils.js"

import {
    uiUpdateRoomUnSelected,
    uiUpdateRoomSelected,
    updateAllRoomsCdLeft,
    addRoomDiv,
} from "./admin.ui.js"

uiUpdateRoomUnSelected() // start unselected

/* setup event listeners for the control panel */
document.getElementById(`select-room-form`).addEventListener('submit', async (event) => {
    event.preventDefault();
    countdownInstruct(getSelectedRoomId(), 'set');
});

document.getElementById(`select-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`set-room-cd-input`).value = document.getElementById(`select-room-dropdown`).value
});

document.getElementById(`set-room-cd-input`).addEventListener('input', (event) => {
    document.getElementById('set-countdown-btn').disabled = !isUserCdInputValid(event.target.value, rooms[getSelectedRoomId()].countdown)
})

document.getElementById(`new-room-form`).addEventListener('submit', (event) => {
    event.preventDefault();
});

document.getElementById(`new-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`new-room-cd-input`).value = document.getElementById(`new-room-dropdown`).value
});

document.getElementById(`new-room-cd-input`).addEventListener('input', (event) => {
    document.getElementById('add-room').disabled = !isUserCdInputValid(event.target.value)
})

document.getElementById('add-room').addEventListener('click', () => addRoomHandler())
document.getElementById('start-pause-cd').addEventListener('click', () => countdownInstruct(getSelectedRoomId(), document.getElementById('start-pause-instr').textContent))
document.getElementById('restart-cd').addEventListener('click', () => countdownInstruct(getSelectedRoomId(), 'restart'))

let roomCounter = 0
let rooms = {}

setInterval(() => updateAllRoomsCdLeft(rooms), 500)


async function countdownInstruct(roomId, instruction) {
    const room = withInstructionMakeRoom(rooms, roomId, instruction) // by reference
    
    try {
        const res = await fetch('toggle-countdown', {
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

async function addRoomHandler() {
    const newRoomId = `${roomCounter}`
    roomCounter += 1
    rooms[newRoomId] = makeNewRoom(document.getElementById(`new-room-cd-input`).value);
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