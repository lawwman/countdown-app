/* TODO:
- admin should initiate from the server as well
- admin ui should reflect what is happening too
- able to name rooms
- error handling dont show on ui
- select between units / mins or seconds. currently is second
- room should detect when lost connection, gracefully exit -> redirect to room-not-found.html
- input does not trim 0 at start
*/

/*
instructions:
 - start, pause is as expected. no new countdown value
 - set means to clear all countdown progress and not start. may have new countdown value
 - restart means to clear all countdown progress and start. no new countdown value
*/

import { withInstructionMakeRoom } from "./admin.utils.js"

const roomHolder = document.getElementById('room-holder')
const selectedRoomLabel = document.getElementById('selected-room-label')
const selectedRoomUrl = document.getElementById('selected-room-url')
const selectedRoomCd = document.getElementById('selected-room-cd')

const startPauseRoomBtn = document.getElementById('start-pause-room')
const startPauseInstr = document.getElementById('start-pause-instr')

const setCountdownBtn = document.getElementById('set-countdown-btn')
startPauseRoomBtn.disabled = true
setCountdownBtn.disabled = true

/* setup event listeners for the control panel */
document.getElementById(`select-room-form`).addEventListener('submit', async (event) => {
    event.preventDefault();
    countdownInstruct('set');
});

document.getElementById(`select-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`select-room-input`).value = document.getElementById(`select-room-dropdown`).value
});

document.getElementById(`new-room-form`).addEventListener('submit', (event) => {
    event.preventDefault();
});

document.getElementById(`new-room-dropdown`).addEventListener('change', () => {
    document.getElementById(`new-room-input`).value = document.getElementById(`new-room-dropdown`).value
});

document.getElementById('add-room').addEventListener('click', () => addRoom())
startPauseRoomBtn.addEventListener('click', () => countdownInstruct(startPauseInstr.textContent))

let roomCounter = 0
const rooms = {}

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

        if (instruction === 'start' || instruction === 'pause') {
            startPauseInstr.textContent = instruction === 'start' ? 'pause' : 'start'
        }

    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

async function addRoom() {
    const newRoomId = `${roomCounter}`
    roomCounter += 1

    const countdown = document.getElementById(`new-room-input`).value
    rooms[newRoomId] = {
        countdown,
        startEpoch: 0,
        pauseBuffer: 0,
        pauseEpoch: undefined,
        instruction: 'set'
    }
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

    const newRoomElement = document.createElement('div')
    newRoomElement.id = newRoomId
    newRoomElement.className = 'dashboard-room no-selection'
    newRoomElement.innerHTML = `
    <p>room: ${newRoomId}</p>
    <p>countdown: ${countdown}</p>
    `
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

        if (isAnyRoomSelected) {
            selectedRoomLabel.textContent = `${newRoomId}`
            const url = new URL(`${location.href}room`)
            url.searchParams.set('id', newRoomId)
            selectedRoomUrl.textContent = `${url.href}`
            startPauseRoomBtn.disabled = false
            setCountdownBtn.disabled = false
            selectedRoomCd.textContent = countdown
            startPauseInstr.textContent = rooms[newRoomId].instruction === 'start' ? 'pause' : 'start'
            
        } else {
            selectedRoomCd.textContent = ''
            selectedRoomLabel.textContent = ``
            selectedRoomUrl.textContent = ``
            startPauseRoomBtn.disabled = true
            setCountdownBtn.disabled = true
            startPauseInstr.textContent = 'start'
        }
    })
}
