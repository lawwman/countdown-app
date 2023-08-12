/* TODO:
- make new room ui input  strict
- error handling dont show on ui
- select between units / mins or seconds. currently is second
- room should detect when lost connection (backend down). display accordingly
- admin should detect when lost connection (backend down). display accordingly
- input does not trim 0 at start
- able to name rooms
- send msg
- show countdown only / show all
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
    makeUrl,
    isCountdownDone,
    figureOutCountdownLeft,
    getSelectedRoomId,
    setSelectedRoomId
} from "./admin.utils.js"

const selectedRoomUrl = document.getElementById('selected-room-url')
const selectedRoomCd = document.getElementById('selected-room-cd')
const setCooldownInput = document.getElementById(`set-room-cd-input`)

const startPauseCdBtn = document.getElementById('start-pause-cd')
const startPauseInstr = document.getElementById('start-pause-instr')

const setCountdownBtn = document.getElementById('set-countdown-btn')
const restartCdBtn = document.getElementById('restart-cd')

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

function updateCountdownLeft() {
    for (const roomId of Object.keys(rooms)) {
        const countdownLeft = figureOutCountdownLeft(rooms[roomId])
        if (getSelectedRoomId() === roomId) {
            if (countdownLeft <= 0) startPauseCdBtn.disabled = true
        }
        
        document.getElementById(`room-cd-left-${roomId}`).textContent = countdownLeft
    }
}
setInterval(updateCountdownLeft, 500)

function updateRoomUi(room, roomId) {
    document.getElementById(`room-cd-${roomId}`).textContent = room.countdown
    updateCountdownLeft()
}

function uiUpdateRoomSelected(room, roomId) {
    selectedRoomCd.textContent = room.countdown
    setSelectedRoomId(roomId)
    selectedRoomUrl.textContent = makeUrl(roomId)
    setCooldownInput.disabled = false
    
    /* no point start or pause if countdown is done. */
    startPauseCdBtn.disabled = isCountdownDone(room)

    /* whenever you start or restart, next button will be to pause. after set or pause, next button will be to start */
    startPauseInstr.textContent = (room.instruction === 'start' || room.instruction === 'restart') ? 'pause' : 'start'

    /* if invalid user cd input, disable set cd btn */
    setCountdownBtn.disabled = !isUserCdInputValid(setCooldownInput.value, room.countdown)

    /* no point restarting if countdown is zero */
    restartCdBtn.disabled = room.countdown === 0 ? true : false

    if (room.instruction === 'set') {
        setCountdownBtn.disabled = true // dont make sense to set same value
        restartCdBtn.disabled = true // dont make sense to restart if just set
    }
    updateRoomUi(room, roomId)
}

function uiUpdateRoomUnSelected() {
    selectedRoomCd.textContent = ''
    setSelectedRoomId('')
    selectedRoomUrl.textContent = ``
    startPauseInstr.textContent = 'start'
    startPauseCdBtn.disabled = true
    setCountdownBtn.disabled = true
    restartCdBtn.disabled = true
    setCooldownInput.disabled = true
}

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
        uiUpdateRoomSelected(room, roomId)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

function addRoomDiv(roomId) {
    const newRoomElement = makeNewRoomDiv(roomId, rooms[roomId].countdown)

    const roomHolder = document.getElementById('room-holder')
    roomHolder.appendChild(newRoomElement)

    newRoomElement.addEventListener('click', () => {
        let isAnyRoomSelected = false
        for (const roomElem of roomHolder.children) {
            if (roomElem.id.replace('room-div-', '') === roomId) {
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

        if (isAnyRoomSelected) uiUpdateRoomSelected(rooms[roomId], roomId)
        else uiUpdateRoomUnSelected()
    })
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
    addRoomDiv(newRoomId)
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
        Object.keys(rooms).map(roomId => addRoomDiv(roomId))
        roomCounter = Object.keys(rooms).length + 1
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

void init()