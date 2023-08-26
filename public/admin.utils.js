import { calculateTimeLeftInt } from './countdown.utils.js'
import { displayRoomCd } from './admin.ui.js'

export function setRoom(room, countdown) {
    room.instruction = 'set'
    room.countdown = countdown;
    room.startEpoch = 0;
    room.pauseBuffer = 0;
    room.pauseEpoch = undefined;
    return room;
}

export function setRoomCdKeepInstruction(room, countdown) {
    room.countdown = countdown
    room.startEpoch = Date.now()
    room.pauseEpoch = undefined
    room.pauseBuffer = 0
    return room
}

export function startRoom(room) {
    room.instruction = 'start'
    if (room.pauseEpoch !== undefined) {
        room.pauseBuffer += room.pauseEpoch - room.startEpoch
    }
    room.startEpoch = Date.now()
    room.pauseEpoch = undefined
    return room
}

export function pauseRoom(room) {
    room.instruction = 'pause'
    room.pauseEpoch = Date.now()
    return room
}

export function restartRoom(room) {
    room.instruction = 'restart'
    room.startEpoch = Date.now()
    room.pauseEpoch = undefined
    room.pauseBuffer = 0
    return room
}

export function makeNewRoom(description) {
    return {
        countdown: 0,
        startEpoch: 0,
        pauseBuffer: 0,
        pauseEpoch: undefined,
        instruction: 'set',
        msg: '',
        countdownOnly: false,
        description: description,
    }
}

export function makeNewRoomDiv(newRoomId, countdown) {
    const cdDiplay = displayRoomCd(countdown)

    const newRoomElement = document.createElement('div')
    newRoomElement.id = `room-div-${newRoomId}`
    newRoomElement.className = 'dashboard-room no-selection'

    const p = document.createElement("p")
    p.textContent = `room name: ${newRoomId}`

    const span = document.createElement("span")
    span.id = `room-cd-left-${newRoomId}`
    span.textContent = cdDiplay

    newRoomElement.appendChild(p)
    newRoomElement.appendChild(span)
    
    return newRoomElement
}

export function makeUrl(roomId) {   
    const url = new URL(`${location.origin}/room`)
    url.searchParams.set('id', roomId)
    return url.href
}

export function getTimeLeftInt(room) {
    if (room.instruction === 'set') return room.countdown
    return calculateTimeLeftInt(
        room.countdown,
        room.pauseBuffer,
        room.startEpoch,
        room.instruction === 'pause' ? room.pauseEpoch : Date.now()
    )
}

export function getSelectedRoomId() {
    return document.getElementById('selected-room-label').textContent
}

export function cloneSelectedRoom(rooms) {
    const roomId = document.getElementById('selected-room-label').textContent
    const room = JSON.parse(JSON.stringify(rooms[roomId]))
    return { roomId, room }
}

export function getNewUniqueRoomId(rooms) {
    let newRoomId = 0;
    while (`${newRoomId}` in rooms) newRoomId += 1;
    return newRoomId;
}