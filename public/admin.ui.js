import {
    makeUrl,
    getTimeLeftInt,
    getSelectedRoomId,
    makeNewRoomDiv,
} from "./admin.utils.js"

const selectedRoomUrl = document.getElementById('selected-room-url')
const setCooldownMinInput = document.getElementById(`set-room-cd-min-input`)
const setCooldownSInput = document.getElementById(`set-room-cd-s-input`)
const setCdDropdown = document.getElementById('set-room-dropdown')
const setCdBtn = document.getElementById('set-cd-btn')

const extend1Min = document.getElementById('extend-1-min')
const extend5Min = document.getElementById('extend-5-min')
const extend10Min = document.getElementById('extend-10-min')

const cdOnlyBtn = document.getElementById('cd-only')

const sendMsgInput = document.getElementById('send-msg-input')
const clearMsgButton = document.getElementById('clear-msg-btn')
const sendMsgButton = document.getElementById('send-msg-btn')
const currentMsg = document.getElementById('current-msg')
const wordCount = document.getElementById('word-count')

const startPauseCdBtn = document.getElementById('start-pause-cd')
const startPauseInstr = document.getElementById('start-pause-instr')

const restartCdBtn = document.getElementById('restart-cd')
const deleteRoomBtn = document.getElementById('delete-room-btn')

export function displayRoomCd(countdown) {
    let mins = `${Math.floor(countdown / 60)}`
    let seconds = `${parseInt(countdown - mins * 60)}`

    if (mins.length < 2) mins = `0${mins}`
    if (seconds.length < 2) seconds = `0${seconds}`

    return `${mins} : ${seconds}`
}

export function updateAllRoomsCdLeft(rooms) {
    for (const roomId of Object.keys(rooms)) {
        const countdownLeft = getTimeLeftInt(rooms[roomId])
        if (getSelectedRoomId() === roomId) {
            if (countdownLeft <= 0) startPauseCdBtn.disabled = true
        }
        document.getElementById(`room-cd-left-${roomId}`).textContent = displayRoomCd(countdownLeft)
    }
}

function setSelectedRoomId(newId) {
    document.getElementById('selected-room-label').textContent = newId
}

export function uiUpdateRoomSelected(roomId, rooms) {
    const room = rooms[roomId]

    /* info section */
    setSelectedRoomId(roomId)
    selectedRoomUrl.textContent = makeUrl(roomId)

    /* message section */
    currentMsg.textContent = room.msg
    clearMsgButton.disabled = room.msg.length <= 0
    sendMsgInput.disabled = false
    sendMsgInput.value = room.msg
    sendMsgButton.disabled = true
    wordCount.textContent = sendMsgInput.value.length

    /* set new cooldown */
    const minutes = Math.floor(room.countdown / 60)
    const seconds = room.countdown - (minutes * 60)

    setCooldownMinInput.value = minutes
    setCooldownSInput.value = seconds

    setCooldownMinInput.disabled = false
    setCooldownSInput.disabled = false
    
    setCdBtn.disabled = false
    setCdDropdown.disabled = false

    /* extend time section */
    extend1Min.disabled = false
    extend5Min.disabled = false
    extend10Min.disabled = false

    /* cd only section */
    cdOnlyBtn.disabled = false
    cdOnlyBtn.textContent = room.countdownOnly ? 'Show All' : 'Show Countdown Only'

    /* pause start restart section */
    const cdDone = getTimeLeftInt(room) <= 0 // no point start or pause if countdown is done.
    startPauseCdBtn.disabled = cdDone

    /* whenever you start or restart, next button will be to pause. after set or pause, next button will be to start */
    startPauseInstr.textContent = (room.instruction === 'start' || room.instruction === 'restart') ? 'pause' : 'start'

    /* no point restarting if countdown is zero */
    restartCdBtn.disabled = room.countdown === 0 ? true : false

    if (room.instruction === 'set') restartCdBtn.disabled = true // dont make sense to restart if just set
    
    deleteRoomBtn.disabled = false
}

export function uiUpdateRoomUnSelected() {
    /* info section */
    setSelectedRoomId('')
    selectedRoomUrl.textContent = `-`

    /* message section */
    sendMsgInput.disabled = true
    clearMsgButton.disabled = true
    sendMsgButton.disabled = true
    wordCount.textContent = 0
    currentMsg.textContent = ''

    /* set new cooldown */
    setCooldownMinInput.disabled = true
    setCooldownSInput.disabled = true
    setCdDropdown.disabled = true
    setCdBtn.disabled = true
    
    /* extend time section */
    extend1Min.disabled = true
    extend5Min.disabled = true
    extend10Min.disabled = true

    startPauseInstr.textContent = 'start'
    startPauseCdBtn.disabled = true
    restartCdBtn.disabled = true
    cdOnlyBtn.disabled = true

    deleteRoomBtn.disabled = true
}

export function addRoomDiv(roomId, rooms) {
    const roomHolder = document.getElementById('room-holder')
    for (const child of roomHolder.children) {
        if (child.id === `room-div-${roomId}`) {
            console.log('room already exists')
            return
        }
    }
    const newRoomElement = makeNewRoomDiv(roomId, rooms[roomId].countdown)
    roomHolder.appendChild(newRoomElement)
    newRoomElement.addEventListener('click', () => {
        let isAnyRoomSelected = false
        for (const roomElem of roomHolder.children) {
            if (roomElem.id === `room-div-${roomId}`) {
                /* div id matches the div being clicked */
                if (roomElem.classList.contains('selected-room')) {
                    /* it is already selected. remove it. */
                    roomElem.classList.remove('selected-room')
                } else {
                    /* hasn't already been selected. add it. */
                    roomElem.classList.add('selected-room')
                    isAnyRoomSelected = true
                }
            } else roomElem.classList.remove('selected-room')
        }

        if (isAnyRoomSelected) uiUpdateRoomSelected(roomId, rooms)
        else uiUpdateRoomUnSelected()
    })
}

export function deleteRoomDiv(roomId) {
    const roomHolder = document.getElementById("room-holder")
    for (const child of roomHolder.children) {
        if (child.id === `room-div-${roomId}`) {
            roomHolder.removeChild(child)
            return
        }
    }
}