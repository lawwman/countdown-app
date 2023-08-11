let socket;
socket = io('')

const clockSpan = document.getElementById('clock')
const countdownSpan = document.getElementById('countdown')
const statusSpan = document.getElementById('status')

function clockTimer() {
    const date = new Date();
    clockSpan.textContent = date.toLocaleTimeString();

    if (countdownStatus === 'start' && countdownCounter >= 0) {
        countdownSpan.textContent = countdownCounter
        countdownCounter -= 1
    } else {
        countdownSpan.textContent = 0
    }
}

let countdownValue = 0;
let countdownCounter = 0;
let countdownStatus = 'idle' // idle | start | pause

clockTimer();
statusSpan.textContent = countdownStatus
setInterval(clockTimer, 1000);

let roomId = (new URL(document.location)).searchParams.get("id");


async function init() {
    const res = await fetch('room-info?'  + new URLSearchParams({ id: roomId }), {
        method: 'GET',
    })

    if (res.status !== 200) {
        console.log('fail to init room....') // i should add a ui for this
        console.log(await res.text())
        return
    }

    const details = await res.json()
    if (details.countdown !== undefined && details.countdown !== null) {
        if (!isNaN(details.countdown)) {
            countdownValue = parseInt(details.countdown);
            countdownCounter = countdownValue
        }
    }
    socket.emit('join-room', roomId)
}

socket.on('start', () => {
    countdownStatus = 'start'
    countdownCounter = countdownValue
})

socket.on('pause', () => {
    countdownStatus = 'pause'
    console.log('paused')
})

socket.on('restart', () => {
    countdownStatus = 'start'
    countdownCounter = countdownValue
})

init()