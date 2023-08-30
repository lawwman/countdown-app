import { calculateTimeLeftInt } from './countdown.utils.js'
import { displayRoomCd } from './admin.ui.js'

export function extendWhilePlaying(room, countdown) {
    room.instruction = 'start'
    room.countdown = countdown
    room.startEpoch = Date.now()
    room.pauseEpoch = undefined
    room.pauseBuffer = 0
    return room
}

export function startRoom(room) {
    const userInputCd = parseInt(document.getElementById(`set-room-cd-min-input`).value) * 60
    const useUserInput = userInputCd > 0
    const cd = useUserInput ? userInputCd : room.countdown

    room.instruction = 'start'

    /* room was paused, add the pauseBuffer */
    if (room.pauseEpoch !== undefined && !useUserInput) {
        room.pauseBuffer += room.pauseEpoch - room.startEpoch
    } else {
        // simple start room from idle
        room.pauseBuffer = 0
    }
    room.countdown = cd
    room.startEpoch = Date.now()
    room.pauseEpoch = undefined

    if (useUserInput) room.originalCd = cd

    return room
}

export function pauseRoom(room) {
    room.instruction = 'pause'
    room.pauseEpoch = Date.now()
    return room
}

export function resetRoom(room) {
    const isPlaying = room.instruction === 'start'

    if (!isPlaying) room.instruction = 'set'
    room.startEpoch = isPlaying ? Date.now() : 0
    room.pauseEpoch = undefined
    room.pauseBuffer = 0
    room.countdown = room.originalCd
    return room
}

export function stopRoom(room) {
    room.countdown = 0
    room.instruction = 'set'
    room.startEpoch = 0
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
        originalCd: 0,
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