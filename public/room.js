let socket;
socket = io('')

const clockSpan = document.getElementById('clock')
const countdownSpan = document.getElementById('countdown')
const statusSpan = document.getElementById('status')

function clockTimer() {
    const date = new Date();
    clockSpan.textContent = date.toLocaleTimeString();
}

clockTimer();
statusSpan.textContent = ''
setInterval(clockTimer, 1000);

let roomId = (new URL(document.location)).searchParams.get("id");

let countdownInterval;

function calculateCountdown(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const pauseBufferSeconds = pauseBuffer / 1000
    const timePassed = (currentEpoch - startEpoch) / 1000;
    const timeLeft = parseInt(countdown - pauseBufferSeconds - timePassed)
    return Math.max(0, timeLeft)
}

function processRoomUpdate(room) {
    console.log('here')
    if (countdownInterval) clearInterval(countdownInterval)
    /* no validation. assuming it is all correct */
    if (room.instruction === 'set') {
        countdownSpan.textContent = room.countdown
        statusSpan.textContent = 'idle'
    } else if (room.instruction === 'start') {
        statusSpan.textContent = 'running'
        countdownSpan.textContent = calculateCountdown(room.countdown, room.pauseBuffer, room.startEpoch, Date.now()) // for immediate response
        countdownInterval = setInterval(() => {
            countdownSpan.textContent = calculateCountdown(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
        }, 1000)
    } else if (room.instruction === 'pause') {
        statusSpan.textContent = 'paused'
        countdownSpan.textContent = calculateCountdown(room.countdown, room.pauseBuffer, room.startEpoch, room.pauseEpoch)
    } else {
        /* restart */
        statusSpan.textContent = 'restarted'
        countdownSpan.textContent = room.countdown
    }
}


async function init() {
    try {
        const res = await fetch('room-info?'  + new URLSearchParams({ id: roomId }), {
            method: 'GET',
        })
    
        if (res.status !== 200) {
            console.log('fail to init room....') // bad response from backend
            console.log(await res.text())
            return
        }
        const room = await res.json()
        processRoomUpdate(room)
        socket.emit('join-room', roomId)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

socket.on('toggle-countdown', (room) => processRoomUpdate(room))

init()