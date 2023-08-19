import {
    makeUrl,
    getTimeLeftInt,
    getSelectedRoomId,
    setSelectedRoomId,
    makeNewRoomDiv,
} from "./admin.utils.js"

import { intCountdownToMinsAndSeconds } from "./countdown.utils.js"

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

const startPauseCdBtn = document.getElementById('start-pause-cd')
const startPauseInstr = document.getElementById('start-pause-instr')

const restartCdBtn = document.getElementById('restart-cd')

const deleteRoomBtn = document.getElementById('delete-room-btn')

export function displayRoomCd(countdown) {
    const mins = Math.floor(countdown / 60)
    const seconds = parseInt(countdown - mins * 60)
    return `${mins} mins, ${seconds}s`
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

function updateRoomUi(roomId, rooms) {
    // document.getElementById(`room-cd-${roomId}`).textContent = displayRoomCd(rooms[roomId].countdown)
    updateAllRoomsCdLeft(rooms)
}

export function isCountdownUpdatedFn(room) {
    const userCd = parseInt(setCooldownMinInput.value) * 60 + parseInt(setCooldownSInput.value)
    const isCountdownUpdated = userCd !== room.countdown
    return isCountdownUpdated;
}

export function uiUpdateRoomSelected(roomId, rooms) {
    const room = rooms[roomId]
    setSelectedRoomId(roomId)
    selectedRoomUrl.textContent = makeUrl(roomId)
    setCooldownMinInput.disabled = false
    setCooldownSInput.disabled = false
    setCdBtn.disabled = false

    extend1Min.disabled = false
    extend5Min.disabled = false
    extend10Min.disabled = false

    setCdDropdown.disabled = false
    cdOnlyBtn.disabled = false

    clearMsgButton.disabled = false
    sendMsgButton.disabled = false
    sendMsgInput.disabled = false
    deleteRoomBtn.disabled = false

    cdOnlyBtn.textContent = room.countdownOnly ? 'Show Countdown And Msg' : 'Show Countdown Only'
    
    /* no point start or pause if countdown is done. */
    const cdDone = getTimeLeftInt(room) <= 0
    startPauseCdBtn.disabled = cdDone

    /* whenever you start or restart, next button will be to pause. after set or pause, next button will be to start */
    startPauseInstr.textContent = (room.instruction === 'start' || room.instruction === 'restart') ? 'pause' : 'start'

    const minutes = Math.floor(room.countdown / 60)
    const seconds = room.countdown - (minutes * 60)

    setCooldownMinInput.value = minutes
    setCooldownSInput.value = seconds
    sendMsgInput.value = room.msg

    /* no point restarting if countdown is zero */
    restartCdBtn.disabled = room.countdown === 0 ? true : false

    if (room.instruction === 'set') restartCdBtn.disabled = true // dont make sense to restart if just set
    updateRoomUi(roomId, rooms)
}

export function uiUpdateRoomUnSelected() {
    setSelectedRoomId('')
    selectedRoomUrl.textContent = `-`
    
    startPauseInstr.textContent = 'start'
    startPauseCdBtn.disabled = true
    restartCdBtn.disabled = true

    extend1Min.disabled = true
    extend5Min.disabled = true
    extend10Min.disabled = true

    setCooldownMinInput.disabled = true
    setCooldownSInput.disabled = true
    setCdDropdown.disabled = true
    setCdBtn.disabled = true

    cdOnlyBtn.disabled = true

    sendMsgInput.disabled = true
    clearMsgButton.disabled = true
    sendMsgButton.disabled = true

    deleteRoomBtn.disabled = true
}

export function addRoomDiv(roomId, rooms) {
    const newRoomElement = makeNewRoomDiv(roomId, rooms[roomId].countdown)

    const roomHolder = document.getElementById('room-holder')
    roomHolder.appendChild(newRoomElement)

    newRoomElement.addEventListener('click', () => {
        let isAnyRoomSelected = false
        for (const roomElem of roomHolder.children) {
            if (roomElem.id.replace('room-div-', '') === roomId) {
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
    let childNode;
    for (const child of roomHolder.children) {
        if (child.id === `room-div-${roomId}`) {
            childNode = child;
            break;
        }
    }

    if (childNode) roomHolder.removeChild(childNode)
}