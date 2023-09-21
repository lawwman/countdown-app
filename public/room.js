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
const cdMin1 = document.getElementById("cd-mins-1")
const cdMin2 = document.getElementById("cd-mins-2")
const cdSec1 = document.getElementById("cd-sec-1")
const cdSec2 = document.getElementById("cd-sec-2")
const statusSpan = document.getElementById('status')
const statusDiv = document.getElementById('status-div')
const roomDiv = document.getElementById("room-div")
const msgP = document.getElementById('msg')



function clockTimer() {
    const date = new Date();
    clockSpan.textContent = date.toLocaleTimeString();
}

clockTimer()
statusSpan.textContent = ''
setInterval(clockTimer, 1000);

let roomId = (new URL(document.location)).searchParams.get("id");
document.getElementById('room-label').textContent = roomId

let countdownInterval;

function inRange(value, point, buffer) {
    return point - buffer <= value && value <= point
}

function updateCountdownUi(room) {
    const { minutesString, secondsString, timeLeftInt } = calculateCountdownForUi(room)
    cdMin1.textContent = minutesString[0]
    cdMin2.textContent = minutesString[1]
    cdSec1.textContent = secondsString[0]
    cdSec2.textContent = secondsString[1]

    if (room.instruction === 'set' || room.instruction === 'pause') return

    if (inRange(timeLeftInt, 60, 3) || inRange(timeLeftInt, 30, 3) || inRange(timeLeftInt, 15, 3)) {
        document.getElementById("countdown-div").classList.add("flash-3x-warning")
    } else {
        document.getElementById("countdown-div").classList.remove("flash-3x-warning")
    }

    if (timeLeftInt <= 10) {
        document.getElementById("countdown-div").classList.add("flash-infinite")
        if (timeLeftInt <= 0) {
            statusSpan.textContent = "done"
            replay()
            document.getElementById("countdown-div").classList.remove("flash-infinite")
            if (countdownInterval) clearInterval(countdownInterval)
        }
    } else document.getElementById("countdown-div").classList.remove("flash-infinite")
}

function dynamicallyFitText() {
    const div = document.getElementById('msg-div')
    const innerDiv = document.getElementById('msg-text-holder')
    let iterations = 0
    let fontSize = 40
    msgP.style.fontSize = `${fontSize}px`

    while (iterations <= 50) {
        iterations += 1
        fontSize += 2
        msgP.style.fontSize = `${fontSize}px`
        if (innerDiv.clientWidth > div.clientWidth || innerDiv.clientHeight > div.clientHeight) {
            fontSize -= 2
            msgP.style.fontSize = `${fontSize}px`
            break
        }
    }
}

let firstLoad = true
function applyRoomValues(room) {
    const msg = room.msg === '' ? '-' : room.msg
    if (msg !== msgP.textContent && !firstLoad) triggerFlashing3x(document.getElementById('msg-div-inner'))
    msgP.textContent = msg;

    document.getElementById('room-description').textContent = room.description.length === 0 ? '-' : room.description
    if (room.countdownOnly) {
        document.getElementById('clock-div').classList.add('invisible')
        document.getElementById('msg-div').classList.add('invisible')
        document.getElementById('countdown-div').classList.add('whole-label')
    } else {
        document.getElementById('clock-div').classList.remove('invisible')
        document.getElementById('msg-div').classList.remove('invisible')
        document.getElementById('countdown-div').classList.remove('whole-label')
    }

    dynamicallyFitText()

    if (countdownInterval) clearInterval(countdownInterval)
    updateCountdownUi(room)
    /* no validation. assuming it is all correct */
    if (room.instruction === 'set') {
        statusSpan.textContent = 'idle'
        replay();
    } else if (room.instruction === 'start') {
        statusSpan.textContent = 'running'
        replay();
        countdownInterval = setInterval(() => { updateCountdownUi(room) }, 1000)
    } else if (room.instruction === 'pause') {
        statusSpan.textContent = 'paused'
        replay();
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
        firstLoad = false
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

socket.on('toggle-room', (room) => applyRoomValues(room))

socket.on("connect", async () => {
    statusSpan.classList.remove("error")
    statusDiv.classList.add("fadeOut")
    replay();
    await init()
});

socket.on('disconnect', (reason) => {
    if (countdownInterval) clearInterval(countdownInterval)
    statusSpan.textContent = "disconnected"
    statusSpan.classList.add("error")
    statusDiv.classList.remove("fadeOut")
    if (reason === "io server disconnect") {
        window.location.replace(`${location.origin}/room`)
    } 
})

socket.io.on("reconnect_attempt", () => {
    console.log('reconnect attempt')
})

document.onmousemove = function(event){
    statusDiv.classList.remove("fadeOut")
    replay2();
    statusDiv.classList.add("fadeOut")
}

function replay(){
    statusDiv.style.animationName = "none";
    requestAnimationFrame(()=>{
        setTimeout(()=>{
            statusDiv.style.animationName=""
        },0);
    });
}

function replay2(){
    roomDiv.style.animationName = "none";
    requestAnimationFrame(()=>{
        setTimeout(()=>{
            roomDiv.style.animationName=""
        },0);
    });
}