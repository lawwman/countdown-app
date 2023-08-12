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
    newRoomElement.id = newRoomId
    newRoomElement.className = 'dashboard-room no-selection'
    newRoomElement.innerHTML = `
    <p>room: ${newRoomId}</p>
    <p>countdown: ${countdown}</p>
    `
    return newRoomElement
}

export function isUserCdInputValid(value, currentValue) {
    if (value === '' || value === '0') return false
    if (value === undefined || value === null) return false
    const integerValue = parseInt(value)
    console.log(integerValue, currentValue)
    if (integerValue <= 0 || integerValue === currentValue) return false
    return true
}

export function makeUrl(roomId) {
    const url = new URL(`${location.href}room`)
    url.searchParams.set('id', roomId)
    return url.href
}