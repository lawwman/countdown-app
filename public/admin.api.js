import { deleteRoomDiv, addRoomDiv, uiUpdateRoomSelected, uiUpdateRoomUnSelected } from "./admin.ui.js"
import { getNewUniqueRoomId } from "./admin.utils.js"

export async function toggleRoomApi(roomId, room, socketId, rooms) {
    try {
        const res = await fetch('toggle-room', {
            method: 'POST',
            body: JSON.stringify({ roomId, room, sourceSocketId: socketId }),
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

export async function deleteRoomApi(roomId, rooms, socketId) {
    document.getElementById('delete-room-btn').disabled = true
    try {
        const res = await fetch('delete-room', {
            method: 'POST',
            body: JSON.stringify({ roomId: roomId, sourceSocketId: socketId }),
            headers: { "Content-Type": "application/json" },
        })
        if (res.status !== 200) {
            console.log('fail to start room....') // bad response from backend
            console.log(await res.text())
            return
        }
        delete rooms[roomId] // all good, delete the room
        uiUpdateRoomUnSelected()
        deleteRoomDiv(roomId)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

export async function addRoomApi(roomId, room, rooms, socketId) {
    try {
        const res = await fetch('add-room', {
            method: 'POST',
            body: JSON.stringify({ roomId, room, sourceSocketId: socketId }),
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (res.status !== 200) {
            console.log('fail to add room....') // bad response from backend
            console.log(await res.text())
            return
        }
        rooms[roomId] = room // all good, add the room
        addRoomDiv(roomId, rooms)
        document.getElementById('new-room-name').value = getNewUniqueRoomId(rooms)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}