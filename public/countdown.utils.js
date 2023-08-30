/* takes in countdown in integer, with unit of seconds returns float */
export function calculateTimeLeftInt(room) {
    if (room.instruction === 'set') return room.countdown
    if (room.instruction === 'pause' && room.pauseEpoch === undefined) return 0 // error

    const currentEpoch = room.instruction === 'pause' ? room.pauseEpoch : Date.now()

    const pauseBufferSeconds = room.pauseBuffer / 1000;
    const timePassed = (currentEpoch - room.startEpoch) / 1000;
    const timeLeft = room.countdown - pauseBufferSeconds - timePassed
    return Math.max(0, timeLeft)
}

/* takes in countdown in integer, with unit of seconds. returns string of float with 2 sf. */
export function calculateCountdownForUi(room) {
    const timeLeftInt = calculateTimeLeftInt(room)
    if (timeLeftInt <= 0) return { timeLeftInt: 0, minutesString: '00', secondsString: '00' }
    const { minutesString, secondsString } = countdownToMinsAndSecString(timeLeftInt)
    return { timeLeftInt, minutesString, secondsString }
}

export function countdownToMinsAndSecString(countdown) {
    const minutes = Math.floor(countdown / 60)
    const seconds = parseInt(countdown - (minutes * 60))
    const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`
    const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`
    return { minutesString, secondsString }
}