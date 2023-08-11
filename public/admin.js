const roomHolder = document.getElementById('room-holder')
const selectedRoomLabel = document.getElementById('selected-room-label')
const selectedRoomUrl = document.getElementById('selected-room-url')


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

let roomCounter = 0
const rooms = {}

// admin should initiate from the server as well

async function addRoom() {
    const newRoomId = `${roomCounter}`
    roomCounter += 1

    const newRoomElement = document.createElement('div')
    newRoomElement.id = newRoomId
    newRoomElement.className = 'dashboard-room no-selection'
    newRoomElement.innerHTML = `
    <p>room: ${newRoomId}</p>
    <p>countdown: -</p>
    `
    roomHolder.appendChild(newRoomElement)

    const newRoomObj = {
        countdown: document.getElementById(`new-room-input`).value,
    }

    rooms[newRoomId] = newRoomObj

    const res = await fetch('sync-rooms', {
        method: 'POST',
        body: JSON.stringify(rooms),
        headers: {
            "Content-Type": "application/json",
        },
    })

    if (res.status !== 200) {
        console.log('fail to add room....') // i should add a ui for this
        console.log(await res.text())
        return
    }

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
            selectedRoomLabel.textContent = `selected room: ${newRoomId}`
            const url = new URL(`${location.href}room`)
            url.searchParams.set('id', newRoomId)
            selectedRoomUrl.textContent = `url: ${url.href}`
        } else {
            selectedRoomLabel.textContent = `selected room: -`
            selectedRoomUrl.textContent = `url: -`
        }
    })
}
