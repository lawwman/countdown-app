/* takes in countdown in integer, with unit of seconds returns float */
export function calculateTimeLeftFloat(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const pauseBufferSeconds = pauseBuffer / 1000.0;
    const timePassed = (currentEpoch - startEpoch) / 1000.0;
    const timeLeftFloat = countdown - pauseBufferSeconds - timePassed
    return timeLeftFloat
}

export function calculateTimeLeftFloat2sf(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const timeLeftFloat = calculateTimeLeftFloat(countdown, pauseBuffer, startEpoch, currentEpoch)
    if (timeLeftFloat <= 0) return 0.00
    const lengthOfString = `${parseInt(timeLeftFloat)}`.length
    return parseFloat(`${timeLeftFloat}`).toPrecision(lengthOfString + 2)
}


/* takes in countdown in integer, with unit of seconds. returns string of float with 2 sf. */
export function calculateCountdownForUi(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const timeLeftFloat = calculateTimeLeftFloat(countdown, pauseBuffer, startEpoch, currentEpoch)

    if (timeLeftFloat <= 0) return { timeLeftFloat: 0, minutesString: '00', secondsString: '00', milisecondsString: '00' }

    const lengthOfString = `${parseInt(timeLeftFloat)}`.length
    const stringWith2Sf = parseFloat(`${timeLeftFloat}`).toPrecision(lengthOfString + 2)

    const split = `${stringWith2Sf}`.split('.')
    const milisecondsString = split[1]
    const intCountdown = parseInt(split[0])
    const { minutes, seconds } = intCountdownToMinsAndSeconds(intCountdown)
    const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`
    const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`

    return { timeLeftFloat, minutesString, secondsString, milisecondsString }

}

export function intCountdownToMinsAndSeconds(countdown) {
    const minutes = Math.floor(countdown / 60)
    const seconds = parseInt(countdown - (minutes * 60))
    return { minutes, seconds }
}