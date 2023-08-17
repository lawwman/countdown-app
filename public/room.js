let socket;
socket = io('')

import { calculateCountdownForUi } from './countdown.utils.js'

const clockSpan = document.getElementById('clock')
const minutesLeft = document.getElementById('minutesLeft')
const minutesRight = document.getElementById('minutesRight')
const secondsLeft = document.getElementById('secondsLeft')
const secondsRight = document.getElementById('secondsRight')
const miliSecondsLeft = document.getElementById('miliSecondsLeft')
const miliSecondsRight = document.getElementById('miliSecondsRight')
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

let countdownInterval;

function updateCountdownUi(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const { minutesString, secondsString, milisecondsString, timeLeftFloat } = calculateCountdownForUi(countdown, pauseBuffer, startEpoch, currentEpoch)

    minutesLeft.textContent = minutesString[0]
    minutesRight.textContent = minutesString[1]

    secondsLeft.textContent = secondsString[0]
    secondsRight.textContent = secondsString[1]

    miliSecondsLeft.textContent = milisecondsString[0]
    miliSecondsRight.textContent = milisecondsString[1]

    if (timeLeftFloat <= 0) statusSpan.textContent = 'done'
    return timeLeftFloat;
}

function showDisconnected() {
    statusSpan.textContent = "disconnected"
    msgSpan.textContent = "attempting to reconnect"
    statusSpan.classList.add("error")
    msgSpan.classList.add("error")
    minutesLeft.classList.add("error")
    minutesRight.classList.add("error")
    secondsLeft.classList.add("error")
    secondsRight.classList.add("error")
    miliSecondsLeft.classList.add("error")
    miliSecondsRight.classList.add("error")
}

function removeDisconnectedMsgs() {
    statusSpan.classList.remove("error")
    msgSpan.classList.remove("error")
    minutesLeft.classList.remove("error")
    minutesRight.classList.remove("error")
    secondsLeft.classList.remove("error")
    secondsRight.classList.remove("error")
    miliSecondsLeft.classList.remove("error")
    miliSecondsRight.classList.remove("error")
}

function applyRoomValues(room) {
    msgSpan.textContent = room.msg === '' ? 'none' : room.msg

    if (room.countdownOnly) {
        document.getElementById('clock-div').classList.add('invisible')
        document.getElementById('msg-div').classList.add('invisible')
    } else {
        document.getElementById('clock-div').classList.remove('invisible')
        document.getElementById('msg-div').classList.remove('invisible')
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
        }, 100)
    } else if (room.instruction === 'pause') {
        statusSpan.textContent = 'paused'
        updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, room.pauseEpoch)
    } else if (room.instruction === 'restart') {
        statusSpan.textContent = 'restarted'
        updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, room.startEpoch)
        countdownInterval = setInterval(() => {
            const countdownLeft = updateCountdownUi(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
            if (countdownLeft <= 0) clearInterval(countdownInterval)
        }, 100)
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

socket.on('disconnect', () => {
    if (countdownInterval) clearInterval(countdownInterval)
    showDisconnected()
})

socket.io.on("reconnect_attempt", () => {
    console.log('reconnect attempt')
})