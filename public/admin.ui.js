import {
    isUserCdInputValid,
    makeUrl,
    isCountdownDone,
    figureOutCountdownLeft,
    getSelectedRoomId,
    setSelectedRoomId,
    makeNewRoomDiv,
} from "./admin.utils.js"

const selectedRoomUrl = document.getElementById('selected-room-url')
const selectedRoomCd = document.getElementById('selected-room-cd')
const setCooldownMinInput = document.getElementById(`set-room-cd-min-input`)
const setCooldownSInput = document.getElementById(`set-room-cd-s-input`)
const setCdDropdown = document.getElementById('set-room-dropdown')
const sendMsgInput = document.getElementById('send-msg')
const sendMsgBtn = document.getElementById('send-msg-btn')

const startPauseCdBtn = document.getElementById('start-pause-cd')
const startPauseInstr = document.getElementById('start-pause-instr')

const setCountdownBtn = document.getElementById('set-countdown-btn')
const restartCdBtn = document.getElementById('restart-cd')

export function updateAllRoomsCdLeft(rooms) {
    for (const roomId of Object.keys(rooms)) {
        const countdownLeft = figureOutCountdownLeft(rooms[roomId])
        if (getSelectedRoomId() === roomId) {
            if (countdownLeft <= 0) startPauseCdBtn.disabled = true
        }
        document.getElementById(`room-cd-left-${roomId}`).textContent = countdownLeft
    }
}

function updateRoomUi(roomId, rooms) {
    document.getElementById(`room-cd-${roomId}`).textContent = rooms[roomId].countdown
    updateAllRoomsCdLeft(rooms)
}

export function uiUpdateRoomSelected(roomId, rooms) {
    const room = rooms[roomId]
    selectedRoomCd.textContent = room.countdown
    setSelectedRoomId(roomId)
    selectedRoomUrl.textContent = makeUrl(roomId)
    setCooldownMinInput.disabled = false
    setCooldownSInput.disabled = false
    setCdDropdown.disabled = false
    sendMsgInput.disabled = false
    sendMsgBtn.disabled = false
    
    /* no point start or pause if countdown is done. */
    startPauseCdBtn.disabled = isCountdownDone(room)

    /* whenever you start or restart, next button will be to pause. after set or pause, next button will be to start */
    startPauseInstr.textContent = (room.instruction === 'start' || room.instruction === 'restart') ? 'pause' : 'start'

    /* if both inputs aren't valid, disable set cd btn */
    setCountdownBtn.disabled = !(isUserCdInputValid(setCooldownMinInput.value) && isUserCdInputValid(setCooldownSInput.value))

    /* no point restarting if countdown is zero */
    restartCdBtn.disabled = room.countdown === 0 ? true : false

    if (room.instruction === 'set') restartCdBtn.disabled = true // dont make sense to restart if just set
    updateRoomUi(roomId, rooms)
}

export function uiUpdateRoomUnSelected() {
    selectedRoomCd.textContent = ''
    setSelectedRoomId('')
    selectedRoomUrl.textContent = ``
    startPauseInstr.textContent = 'start'
    startPauseCdBtn.disabled = true
    setCountdownBtn.disabled = true
    restartCdBtn.disabled = true
    setCooldownMinInput.disabled = true
    setCooldownSInput.disabled = true
    setCdDropdown.disabled = true
    sendMsgInput.disabled = true
    sendMsgBtn.disabled = true
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