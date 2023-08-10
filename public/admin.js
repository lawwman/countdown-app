// const socket = io('')
// console.log(socket)

const roomHolder = document.querySelector('#room-holder')
const selectedRoomLabel = document.getElementById('selected-room-label')
const selectedRoomUrl = document.getElementById('selected-room-url')


/* setup event listeners for the control panel */
document.getElementById(`control-form`).addEventListener('submit', (event) => {
    event.preventDefault();
});

document.getElementById(`control-select`).addEventListener('change', () => {
    document.getElementById(`control-input`).value = document.getElementById(`control-select`).value
});

document.getElementById('add-room').addEventListener('click', () => addRoom())

let roomCounter = 0
const rooms = {}

function addRoom() {
    const newRoomId = roomCounter
    roomCounter += 1

    const newRoom = document.createElement('div')
    newRoom.id = newRoomId
    newRoom.className = 'dashboard-room no-selection'
    newRoom.innerHTML = `
    <p>room: ${newRoomId}</p>
    <p>countdown: -</p>
    `
    roomHolder.appendChild(newRoom)
    rooms[newRoomId] = {
        countdown: undefined,
        startTime: undefined
    }

    newRoom.addEventListener('click', () => {
        const rooms = roomHolder.children
        for (const room of rooms) {
            if (room.id === `${newRoomId}`) {
                /* div id matches the div being clicked */
                if (room.classList.contains('selected-room')) {
                    /* it is already selected. remove it. */
                    room.classList.remove('selected-room')
                    selectedRoomLabel.textContent = `selected room: -`
                    selectedRoomUrl.textContent = `url: -`
                } else {
                    /* hasn't already been selected. add it. */
                    room.classList.add('selected-room')
                    selectedRoomLabel.textContent = `selected room: ${newRoomId}`
                    const url = new URL(`${location.href}room`)
                    url.searchParams.set('id', newRoomId)
                    selectedRoomUrl.textContent = `url: ${url.href}`
                }
            }
            else room.classList.remove('selected-room')
        }
    })
}
