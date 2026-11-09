import type { Server } from 'socket.io'

// jedina instancia socket.io servera - nastavi sa pri starte servera
let io: Server | null = null

// ulozenie socket.io servera
export function setSocketServer(server: Server) {
  io = server
}

// --- miestnosti ---

// nazov miestnosti kanala, napr. "channel:5"
export function channelRoom(channelId: number) {
  return `channel:${channelId}`
}

// nazov miestnosti pouzivatela, napr. "user:3"
export function userRoom(userId: number) {
  return `user:${userId}`
}

// --- posielanie udalosti ---

// posle udalost vsetkym pripojenym clenom kanala
export function emitToChannel(channelId: number, event: string, data: object) {
  if (!io) return
  io.to(channelRoom(channelId)).emit(event, data)
}

// posle udalost jednemu pouzivatelovi (do vsetkych jeho otvorenych okien)
export function emitToUser(userId: number, event: string, data: object) {
  if (!io) return
  io.to(userRoom(userId)).emit(event, data)
}

// oznami clenom kanala, ze sa v kanali nieco zmenilo
// frontend si potom znova nacita zoznam kanalov
export function notifyChannelChanged(channelId: number) {
  emitToChannel(channelId, 'channels:changed', {})
}

// --- prihlasovanie do miestnosti kanala ---

// pouzivatel sa stal clenom kanala - jeho okna zacnu dostavat udalosti z kanala
export function addUserToChannelRoom(userId: number, channelId: number) {
  if (!io) return
  io.in(userRoom(userId)).socketsJoin(channelRoom(channelId))
}

// pouzivatel uz nie je clenom kanala - jeho okna prestanu dostavat udalosti z kanala
export function removeUserFromChannelRoom(userId: number, channelId: number) {
  if (!io) return
  io.in(userRoom(userId)).socketsLeave(channelRoom(channelId))
}

// kanal zanikol - oznamime to clenom a zrusime jeho miestnost
export function closeChannelRoom(channelId: number, channelName: string) {
  if (!io) return
  emitToChannel(channelId, 'channel:deleted', { name: channelName })
  io.in(channelRoom(channelId)).socketsLeave(channelRoom(channelId))
}
