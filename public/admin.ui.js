import {
    makeUrl,
    makeNewRoomDiv,
    getSelectedRoomId,
} from "./admin.utils.js"

import { calculateTimeLeftInt, countdownToMinsAndSecString } from './countdown.utils.js'

const selectedRoomUrl = document.getElementById('selected-room-url')
const setCooldownMinInput = document.getElementById(`set-room-cd-min-input`)
const formCdDisplay = document.getElementById('form-cd-display')
const originalCdDisplay = document.getElementById('original-cd')

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

const resetCdBtn = document.getElementById('reset-cd')
const stopCdBtn = document.getElementById('stop-cd')
const deleteRoomBtn = document.getElementById('delete-room-btn')

export function displayRoomCd(countdown) {
    const { minutesString, secondsString } = countdownToMinsAndSecString(countdown)
    return `${minutesString} : ${secondsString}`
}

export function updateAllRoomsCdLeft(rooms) {
    for (const roomId of Object.keys(rooms)) {
        const countdownLeft = calculateTimeLeftInt(rooms[roomId])
        document.getElementById(`room-cd-left-${roomId}`).textContent = displayRoomCd(countdownLeft)
    }

    if (getSelectedRoomId() !== '') {
        const room = rooms[getSelectedRoomId()]
        formCdDisplay.textContent = displayRoomCd(calculateTimeLeftInt(room))
    } else {
        formCdDisplay.textContent = displayRoomCd(0)
    }
}

function setSelectedRoomId(newId) {
    document.getElementById('selected-room-label').textContent = newId
}

export function startPauseLogic(room) {
    const canStart = (room.instruction === 'pause' || room.instruction === 'set') && (calculateTimeLeftInt(room) > 0 || parseInt(setCooldownMinInput.value) > 0)
    startPauseCdBtn.disabled = !(canStart || room.instruction === 'start')

    /* whenever you start or reset, next button will be to pause. after set or pause, next button will be to start */
    startPauseInstr.textContent = canStart ? 'start' : 'pause'
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
    if (room.instruction === 'start') setCooldownMinInput.value = 0
    setCooldownMinInput.disabled = false

    /* extend time section */
    extend1Min.disabled = room.instruction !== 'start'
    extend5Min.disabled = room.instruction !== 'start'
    extend10Min.disabled = room.instruction !== 'start'

    originalCdDisplay.textContent = `${room.originalCd / 60} mins`

    /* cd only section */
    cdOnlyBtn.disabled = false
    cdOnlyBtn.textContent = room.countdownOnly ? 'Show All' : 'Show Countdown Only'

    formCdDisplay.textContent = displayRoomCd(calculateTimeLeftInt(room))

    /* pause start section */
    startPauseLogic(room)
    resetCdBtn.disabled = false
    stopCdBtn.disabled = room.countdown <= 0
    deleteRoomBtn.disabled = false
}

export function unselectAllRoom() {
    const roomHolder = document.getElementById('room-holder')
    for (const child of roomHolder.children) {
        child.classList.remove('selected-room')
    }
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
    
    /* extend time section */
    extend1Min.disabled = true
    extend5Min.disabled = true
    extend10Min.disabled = true

    startPauseInstr.textContent = 'start'
    startPauseCdBtn.disabled = true
    resetCdBtn.disabled = true
    stopCdBtn.disabled = true
    cdOnlyBtn.disabled = true

    deleteRoomBtn.disabled = true

    formCdDisplay.textContent = displayRoomCd(0)
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