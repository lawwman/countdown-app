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
        room.countdown = document.getElementById(`select-room-input`).value;
        console.log(room.countdown)
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