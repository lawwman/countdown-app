import { calculateCountdown } from './countdown.utils.js'

export function withInstructionMakeRoom(rooms, roomId, instruction) {
    const room = JSON.parse(JSON.stringify(rooms[roomId]))
    room.instruction = instruction

    if (instruction === 'start') {
        if (room.pauseEpoch !== undefined) {
            room.pauseBuffer += room.pauseEpoch - room.startEpoch
        }
        room.startEpoch = Date.now()
        room.pauseEpoch = undefined
    } else if (instruction === 'pause') {
        room.pauseEpoch = Date.now()
    } else if (instruction === 'set') {
        room.countdown = parseInt(document.getElementById(`select-room-input`).value);
        room.startEpoch = 0;
        room.pauseBuffer = 0;
        room.pauseEpoch = undefined;
    } else {
        /* restart */
        room.startEpoch = Date.now()
        room.pauseEpoch = undefined
        room.pauseBuffer = 0
    }

    return room;
}

export function makeNewRoom(countdown) {
    return {
        countdown: parseInt(countdown),
        startEpoch: 0,
        pauseBuffer: 0,
        pauseEpoch: undefined,
        instruction: 'set'
    }
}
export function makeNewRoomDiv(newRoomId, countdown) {
    const newRoomElement = document.createElement('div')
    newRoomElement.id = `room-div-${newRoomId}`
    newRoomElement.className = 'dashboard-room no-selection'
    newRoomElement.innerHTML = `
    <p>room: ${newRoomId}</p>
    <p>countdown: <span id="room-cd-${newRoomId}">${countdown}</span></p>
    <p>countdown left: <span id="room-cd-left-${newRoomId}">${countdown}</span></p>
    `
    return newRoomElement
}

export function isUserCdInputValid(value, currentValue) {
    if (value === '' || value === '0') return false
    if (value === undefined || value === null) return false
    const integerValue = parseInt(value)
    if (integerValue <= 0 || integerValue === currentValue) return false
    return true
}

export function makeUrl(roomId) {
    const url = new URL(`${location.href}room`)
    url.searchParams.set('id', roomId)
    return url.href
}

export function figureOutCountdownLeft(room) {
    if (room.instruction === 'set') return room.countdown
    return calculateCountdown(
        room.countdown,
        room.pauseBuffer,
        room.startEpoch,
        room.instruction === 'pause' ? room.pauseEpoch : Date.now()
    )
}

export function isCountdownDone(room) {
    return figureOutCountdownLeft(room) <= 0
}

export function getSelectedRoomId() {
    return document.getElementById('selected-room-label').textContent
}

export function setSelectedRoomId(newId) {
    document.getElementById('selected-room-label').textContent = newId
}