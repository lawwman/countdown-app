export function calculateCountdown(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const pauseBufferSeconds = pauseBuffer / 1000.0;
    const timePassed = (currentEpoch - startEpoch) / 1000.0;
    const timeLeftFloat = countdown - pauseBufferSeconds - timePassed
    const lengthOfString = `${parseInt(timeLeftFloat)}`.length
    const timeLeft = parseFloat(`${timeLeftFloat}`).toPrecision(lengthOfString + 2)
    return Math.max(0, timeLeft)
}