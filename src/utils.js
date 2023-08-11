export function parseRoomId(id, rooms) {
  console.log(`received query params for id: ${id}`)
  if (id === undefined || id === null) return undefined;
  if (!(id in rooms)) return undefined // not in rooms
  return id
  }