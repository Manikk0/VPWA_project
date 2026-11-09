import { io } from 'socket.io-client'
import { SERVER_URL } from '@/config/app'

// pripojenie k socket.io serveru - jedno pre celu aplikaciu
let socket = null

// pripojenie k serveru
export function connectSocket(token) {
  // ak uz sme pripojeni, stare pripojenie zrusime
  disconnectSocket()

  socket = io(SERVER_URL, {
    auth: { token: token },
  })
  return socket
}

// odpojenie od servera pri odhlaseni
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// vrati aktualne pripojenie
export function getSocket() {
  return socket
}
