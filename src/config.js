import { networkInterfaces } from 'os'

const nets = networkInterfaces();

function getIpAddress() {
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family !== 'IPv4') continue;
            if (net.internal) continue;
            return net.address;
        }
    }
    throw new Error(`unable to get device's ip addr`)
}

const LOCALHOST = '127.0.0.1'
const ACTUAL_IP = getIpAddress()

const useLocal = false

export const PORT = 3000;
export const IP = useLocal ? LOCALHOST : ACTUAL_IP