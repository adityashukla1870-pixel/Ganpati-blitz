import { io } from 'socket.io-client'

const defaultSocketUrl = import.meta.env.PROD
  ? 'https://ganpati-blitz.onrender.com'
  : 'http://localhost:5000'

let rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || defaultSocketUrl
if (rawSocketUrl.includes('ganpati-blitz-backend.onrender.com')) {
  rawSocketUrl = 'https://ganpati-blitz.onrender.com'
}
const SOCKET_URL = rawSocketUrl.replace(/\/+$/, '')

let socket = null

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
  }
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
}
