export function parseQueryParamForRoomId(query, rooms) {
  const id = query['id'];
  console.log(`received query params for id: ${id}`)
  if (id === undefined || id === null) return undefined;
  const roomId = query['id']; // currently of type string
  if (!(roomId in rooms)) return undefined // not in rooms
  return roomId
  }