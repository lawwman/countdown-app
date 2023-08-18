import {
    makeUrl,
    figureOutCountdownLeft,
    getSelectedRoomId,
    setSelectedRoomId,
    makeNewRoomDiv,
} from "./admin.utils.js"

import { intCountdownToMinsAndSeconds } from "./countdown.utils.js"

const selectedRoomUrl = document.getElementById('selected-room-url')
const setCooldownMinInput = document.getElementById(`set-room-cd-min-input`)
const setCooldownSInput = document.getElementById(`set-room-cd-s-input`)
const setCdDropdown = document.getElementById('set-room-dropdown')
const sendMsgInput = document.getElementById('send-msg')
const cdOnlyCheckBox = document.getElementById('cd-only-checkbox')
const discardChangesBtn = document.getElementById('discard-form-changes')

const startPauseCdBtn = document.getElementById('start-pause-cd')
const startPauseInstr = document.getElementById('start-pause-instr')

const updateRoomBtn = document.getElementById('update-room-btn')
const restartCdBtn = document.getElementById('restart-cd')

export function displayRoomCd(countdown) {
    const mins = Math.floor(countdown / 60)
    const seconds = parseInt(countdown - mins * 60)
    return `${mins} mins, ${seconds}s`
}

export function updateAllRoomsCdLeft(rooms) {
    for (const roomId of Object.keys(rooms)) {
        const countdownLeft = figureOutCountdownLeft(rooms[roomId])
        if (getSelectedRoomId() === roomId) {
            if (countdownLeft <= 0) startPauseCdBtn.disabled = true
        }
        document.getElementById(`room-cd-left-${roomId}`).textContent = displayRoomCd(countdownLeft)
    }
}

function updateRoomUi(roomId, rooms) {
    document.getElementById(`room-cd-${roomId}`).textContent = displayRoomCd(rooms[roomId].countdown)
    updateAllRoomsCdLeft(rooms)
}

export function isCountdownUpdatedFn(room) {
    const { minutes, seconds } = intCountdownToMinsAndSeconds(room.countdown)
    const isCountdownUpdated = !(`${minutes}` === setCooldownMinInput.value && `${seconds}` === setCooldownSInput.value)
    return isCountdownUpdated;
}

export function isUserFormInputUpdated(room) {
    const isCountdownUpdated = isCountdownUpdatedFn(room)
    const isCountdownOnlyUpdated = room.countdownOnly !== cdOnlyCheckBox.checked
    const isMsgUpdated = room.msg !== sendMsgInput.value

    return (isCountdownOnlyUpdated || isCountdownUpdated || isMsgUpdated)
}

export function uiUpdateRoomSelected(roomId, rooms) {
    const room = rooms[roomId]
    setSelectedRoomId(roomId)
    selectedRoomUrl.textContent = makeUrl(roomId)
    setCooldownMinInput.disabled = false
    setCooldownSInput.disabled = false
    setCdDropdown.disabled = false
    sendMsgInput.disabled = false
    cdOnlyCheckBox.disabled = false
    updateRoomBtn.disabled = true
    discardChangesBtn.disabled = true
    
    /* no point start or pause if countdown is done. */
    const cdDone = figureOutCountdownLeft(room) <= 0
    startPauseCdBtn.disabled = cdDone

    /* whenever you start or restart, next button will be to pause. after set or pause, next button will be to start */
    startPauseInstr.textContent = (room.instruction === 'start' || room.instruction === 'restart') ? 'pause' : 'start'

    const minutes = Math.floor(room.countdown / 60)
    const seconds = room.countdown - (minutes * 60)

    setCooldownMinInput.value = minutes
    setCooldownSInput.value = seconds
    cdOnlyCheckBox.checked = room.countdownOnly
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
    updateRoomBtn.disabled = true
    restartCdBtn.disabled = true
    setCooldownMinInput.disabled = true
    setCooldownSInput.disabled = true
    setCdDropdown.disabled = true
    sendMsgInput.disabled = true
    cdOnlyCheckBox.disabled = true
    discardChangesBtn.disabled = true
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