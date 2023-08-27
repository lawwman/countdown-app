export function parseRoomId(id, rooms) {
  if (id === undefined || id === null) return undefined;
  if (!(id in rooms)) return undefined // not in rooms
  return id
}

export function isValidInstruction(instruction) {
  return instruction === 'start' || instruction === 'pause' || instruction === 'set'
}