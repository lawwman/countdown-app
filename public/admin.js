const roomHolder = document.getElementById('room-holder')
const selectedRoomLabel = document.getElementById('selected-room-label')
const selectedRoomUrl = document.getElementById('selected-room-url')
const selectedRoomCd = document.getElementById('selected-room-cd')

const startPauseRoomBtn = document.getElementById('start-pause-room')
startPauseRoomBtn.disabled = true

/* setup event listeners for the control panel */
document.getElementById(`select-room-form`).addEventListener('submit', (event) => {
    event.preventDefault();
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
startPauseRoomBtn.addEventListener('click', () => startPauseRoom())

let roomCounter = 0
const rooms = {}

// admin should initiate from the server as well

async function startPauseRoom() {
    const roomId = selectedRoomLabel.textContent
    try {
        const res = await fetch('start-room', {
            method: 'POST',
            body: JSON.stringify({
                roomId,
                room: {
                    startEpoch: Date.now(),
                    pauseEpoch: undefined,
                    pauseBuffer: 0,
                    countdown: rooms[roomId].countdown,
                },
                
            }),
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (res.status !== 200) {
            console.log('fail to start room....') // bad response from backend
            console.log(await res.text())
            return
        }
    } catch (err) {
        console.log(err) // cant reach backend
        return
    }
}

async function addRoom() {
    const newRoomId = `${roomCounter}`
    roomCounter += 1

    const countdown = document.getElementById(`new-room-input`).value
    rooms[newRoomId] = { countdown, startEpoch: 0, pauseBuffer: 0, pauseEpoch: undefined }
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
        console.log(err) // cant reach backend
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
        const rooms = roomHolder.children
        let isAnyRoomSelected = false
        for (const room of rooms) {
            if (room.id === newRoomId) {
                /* div id matches the div being clicked */
                if (room.classList.contains('selected-room')) {
                    /* it is already selected. remove it. */
                    room.classList.remove('selected-room')
                } else {
                    /* hasn't already been selected. add it. */
                    room.classList.add('selected-room')
                    isAnyRoomSelected = true
                }
            } else room.classList.remove('selected-room')
        }

        if (isAnyRoomSelected) {
            selectedRoomLabel.textContent = `${newRoomId}`
            const url = new URL(`${location.href}room`)
            url.searchParams.set('id', newRoomId)
            selectedRoomUrl.textContent = `${url.href}`
            startPauseRoomBtn.disabled = false
            selectedRoomCd.textContent = countdown
            
        } else {
            selectedRoomCd.textContent = ''
            selectedRoomLabel.textContent = ``
            selectedRoomUrl.textContent = ``
            startPauseRoomBtn.disabled = true
        }
    })
}
