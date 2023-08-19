/* takes in countdown in integer, with unit of seconds returns float */
export function calculateTimeLeftInt(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const pauseBufferSeconds = pauseBuffer / 1000;
    const timePassed = (currentEpoch - startEpoch) / 1000;
    const timeLeft = countdown - pauseBufferSeconds - timePassed
    return Math.max(0, timeLeft)
}

/* takes in countdown in integer, with unit of seconds. returns string of float with 2 sf. */
export function calculateCountdownForUi(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const timeLeftInt = calculateTimeLeftInt(countdown, pauseBuffer, startEpoch, currentEpoch)

    if (timeLeftInt <= 0) return { timeLeftInt: 0, minutesString: '00', secondsString: '00' }

    const { minutes, seconds } = intCountdownToMinsAndSeconds(timeLeftInt)
    const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`
    const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`

    return { timeLeftInt, minutesString, secondsString }

}

export function intCountdownToMinsAndSeconds(countdown) {
    const minutes = Math.floor(countdown / 60)
    const seconds = parseInt(countdown - (minutes * 60))
    return { minutes, seconds }
}