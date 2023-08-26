let socket;
socket = io('')

import { calculateCountdownForUi } from './countdown.utils.js'

function triggerFlashing3x(element) {
    if (element.classList.contains('flash-3x-warning')) {
        element.classList.add('flash-3x-warning-2')
        element.classList.remove('flash-3x-warning')
    } else if (element.classList.contains('flash-3x-warning-2')) {
        element.classList.add('flash-3x-warning')
        element.classList.remove('flash-3x-warning-2')
    } else {
        element.classList.add('flash-3x-warning')
    }
}

const clockSpan = document.getElementById('clock')
const countdownElement = document.getElementById("countdown")
const statusSpan = document.getElementById('status')
const msgSpan = document.getElementById('msg')

function clockTimer() {
    const date = new Date();
    clockSpan.textContent = date.toLocaleTimeString();
}

clockTimer();
statusSpan.textContent = ''
setInterval(clockTimer, 1000);

let roomId = (new URL(document.location)).searchParams.get("id");

document.getElementById('room-label').textContent = roomId

let countdownInterval;

function inRange(value, point, buffer) {
    return point - buffer <= value && value <= point
}

function updateCountdownUi(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const { minutesString, secondsString, timeLeftInt } = calculateCountdownForUi(countdown, pauseBuffer, startEpoch, currentEpoch)

    countdownElement.textContent = `${minutesString}:${secondsString}`

    if (inRange(timeLeftInt, 60, 3) || inRange(timeLeftInt, 30, 3) || inRange(timeLeftInt, 15, 3)) {
        document.getElementById("countdown-div").classList.add("flash-3x-warning")
    } else {
        document.getElementById("countdown-div").classList.remove("flash-3x-warning")
    }

    if (timeLeftInt <= 10 && startEpoch !== currentEpoch) {
        document.getElementById("countdown-div").classList.add("flash-infinite")
    } else {
        document.getElementById("countdown-div").classList.remove("flash-infinite")
    }

    if (timeLeftInt <= 0 && startEpoch !== currentEpoch) statusSpan.textContent = "done"
    return timeLeftInt;
}

function showDisconnected() {
    statusSpan.textContent = "disconnected"
    statusSpan.classList.add("error")
    msgSpan.classList.add("error")
    document.getElementById("countdown-div").classList.add("error")
}

function removeDisconnectedMsgs() {
    statusSpan.classList.remove("error")
    msgSpan.classList.remove("error")
    document.getElementById("countdown-div").classList.remove("error")
}



function applyRoomValues(room) {
    const msg = room.msg === '' ? '-' : room.msg
    if (msg !== msgSpan.textContent) triggerFlashing3x(msgSpan)
    msgSpan.textContent = msg;

    document.getElementById('room-description').textContent = room.description.length === 0 ? '-' : room.description
    if (room.countdownOnly) {
        document.getElementById('clock-div').classList.add('invisible')
        document.getElementById('msg-div').classList.add('invisible')
        document.getElementById('countdown').classList.add('whole-label')
        document.getElementById('status-div').classList.add('bottom-label')
    } else {
        document.getElementById('clock-div').classList.remove('invisible')
        document.getElementById('msg-div').classList.remove('invisible')
        document.getElementById('countdown').classList.remove('whole-label')
        document.getElementById('status-div').classList.remove('bottom-label')
    }

    if (countdownInterval) clearInterval(countdownInterval)
    /* no validation. assuming it is all correct */
    if (room.instruction === 'set') {
        updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, room.startEpoch)
        statusSpan.textContent = 'idle'
    } else if (room.instruction === 'start') {
        statusSpan.textContent = 'running'
        updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
        countdownInterval = setInterval(() => {
            const countdownLeft = updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
            if (countdownLeft <= 0) clearInterval(countdownInterval)
        }, 1000)
    } else if (room.instruction === 'pause') {
        statusSpan.textContent = 'paused'
        updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, room.pauseEpoch)
    } else if (room.instruction === 'restart') {
        statusSpan.textContent = 'restarted'
        updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, room.startEpoch)
        countdownInterval = setInterval(() => {
            const countdownLeft = updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
            if (countdownLeft <= 0) clearInterval(countdownInterval)
        }, 1000)
    }
}

async function init() {
    socket.emit('join-room', roomId) // join room first before init. so you do not miss updates
    try {
        const res = await fetch('room-info?'  + new URLSearchParams({ id: roomId }), {
            method: 'GET',
        })
    
        if (res.status !== 200) {
            console.log('fail to init room....') // bad response from backend
            console.log(await res.text())            
            window.location.replace(`${location.origin}/room`)
            return
        }
        const room = await res.json()
        applyRoomValues(room)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

socket.on('toggle-room', (room) => applyRoomValues(room))

socket.on("connect", async () => {
    removeDisconnectedMsgs();
    await init()
});

socket.on('disconnect', (reason) => {
    if (countdownInterval) clearInterval(countdownInterval)
    showDisconnected()
    if (reason === "io server disconnect") {
        window.location.replace(`${location.origin}/room`)
    } 
})

socket.io.on("reconnect_attempt", () => {
    console.log('reconnect attempt')
})