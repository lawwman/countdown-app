export function makeNewRoom(description) {
    return {
        countdown: 0,
        startEpoch: 0,
        pauseBuffer: 0,
        pauseEpoch: undefined,
        instruction: 'set',
        msg: '',
        countdownOnly: false,
        description: description,
        originalCd: 0,
    }
}