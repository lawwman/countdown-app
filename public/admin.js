/* TODO:
- admin ui should reflect what is happening too
- error handling dont show on ui
- select between units / mins or seconds. currently is second
- room should detect when lost connection (backend down). display accordingly
- admin should detect when lost connection (backend down). display accordingly
- input does not trim 0 at start
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
    makeNewRoomDiv,
    isUserCdInputValid,
    makeUrl
} from "./admin.utils.js"

import { calculateCountdown } from './countdown.utils.js'

const roomHolder = document.getElementById('room-holder')
const selectedRoomLabel = document.getElementById('selected-room-label')
const selectedRoomUrl = document.getElementById('selected-room-url')
const selectedRoomCd = document.getElementById('selected-room-cd')

const startPauseCdBtn = document.getElementById('start-pause-cd')
const startPauseInstr = document.getElementById('start-pause-instr')

const setCountdownBtn = document.getElementById('set-countdown-btn')
const restartCdBtn = document.getElementById('restart-cd')
startPauseCdBtn.disabled = true
setCountdownBtn.disabled = true
restartCdBtn.disabled = true

/* setup event listeners for the control panel */
document.getElementById(`select-room-form`).addEventListener('submit', async (event) => {
    event.preventDefault();
    countdownInstruct('set');
});

document.getElementById(`select-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`select-room-input`).value = document.getElementById(`select-room-dropdown`).value
});

document.getElementById(`select-room-input`).addEventListener('input', (event) => {
    setCountdownBtn.disabled = !isUserCdInputValid(event.target.value, rooms[selectedRoomLabel.textContent].countdown)
})

document.getElementById(`new-room-form`).addEventListener('submit', (event) => {
    event.preventDefault();
});

document.getElementById(`new-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`new-room-input`).value = document.getElementById(`new-room-dropdown`).value
});

document.getElementById('add-room').addEventListener('click', () => addRoom())
startPauseCdBtn.addEventListener('click', () => countdownInstruct(startPauseInstr.textContent))
restartCdBtn.addEventListener('click', () => countdownInstruct('restart'))

let roomCounter = 0
let rooms = {}


function controlAppearance(room, roomId) {
    selectedRoomCd.textContent = room.countdown
    selectedRoomLabel.textContent = roomId
    selectedRoomUrl.textContent = makeUrl(roomId)

    /* figure out countdown base on latest instructions */
    let countdown = 0
    if (room.instruction === 'set') {
        countdown = room.countdown
    } else if (room.instruction === 'pause') {
        countdown = calculateCountdown(
            room.countdown,
            room.pauseBuffer,
            room.startEpoch,
            room.pauseEpoch
        )
    } else {
        /* start or restart */
        countdown = calculateCountdown(
            room.countdown,
            room.pauseBuffer,
            room.startEpoch,
            Date.now()
        )
    }
    const isDone = countdown <= 0
    startPauseCdBtn.disabled = isDone

    /* if invalid user cd input, disable set cd btn */
    setCountdownBtn.disabled = !isUserCdInputValid(document.getElementById(`select-room-input`).value, room.countdown)

    /* no point restarting if countdown is zero */
    restartCdBtn.disabled = room.countdown === 0 ? true : false

    if (room.instruction === 'set') {
        startPauseInstr.textContent = 'start'
        setCountdownBtn.disabled = true // dont make sense to set same value
        restartCdBtn.disabled = true // dont make sense to restart if just set
    } else if (room.instruction === 'start') {
        startPauseInstr.textContent = 'pause'
    } else if (room.instruction === 'pause') {
        startPauseInstr.textContent = 'start'
    } else {
        /* restart */
        startPauseInstr.textContent = 'pause' // since restart automatically starts it, makes sense btn is now to pause
    }
}

function controlAppearanceOnUnselect() {
    selectedRoomCd.textContent = ''
    selectedRoomLabel.textContent = ``
    selectedRoomUrl.textContent = ``
    startPauseCdBtn.disabled = true
    startPauseInstr.textContent = 'start'
    setCountdownBtn.disabled = true
    restartCdBtn.disabled = true
}

async function countdownInstruct(instruction) {
    const roomId = selectedRoomLabel.textContent
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
        controlAppearance(room, roomId)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

async function addRoom() {
    const newRoomId = `${roomCounter}`
    roomCounter += 1
    rooms[newRoomId] = makeNewRoom(document.getElementById(`new-room-input`).value);
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

    const newRoomElement = makeNewRoomDiv(newRoomId, rooms[newRoomId].countdown)
    roomHolder.appendChild(newRoomElement)

    newRoomElement.addEventListener('click', () => {
        const roomHolderChildren = roomHolder.children
        let isAnyRoomSelected = false
        for (const roomElem of roomHolderChildren) {
            if (roomElem.id === newRoomId) {
                /* div id matches the div being clicked */
                if (roomElem.classList.contains('selected-room')) {
                    /* it is already selected. remove it. */
                    roomElem.classList.remove('selected-room')
                } else {
                    /* hasn't already been selected. add it. */
                    roomElem.classList.add('selected-room')
                    isAnyRoomSelected = true
                }
            } else roomElem.classList.remove('selected-room')
        }

        if (isAnyRoomSelected) controlAppearance(rooms[newRoomId], newRoomId)
        else controlAppearanceOnUnselect()
    })
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
        for (const roomId of Object.keys(rooms)) {
            const newRoomElement = makeNewRoomDiv(roomId, rooms[roomId].countdown)
            roomHolder.appendChild(newRoomElement)
        }
        roomCounter = Object.keys(rooms).length + 1
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

void init()