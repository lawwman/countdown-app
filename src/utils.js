/* returns false if id is invalid or does not exist in rooms. else if room id exists, return true */
export function doesRoomExist(id, rooms) {
  if (id === undefined || id === null) return false;
  if (!(id in rooms)) return false
  return true
}
