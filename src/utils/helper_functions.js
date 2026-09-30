import { Notify } from 'quasar'
import { users } from '@/mockData'

// funkcia vrati aktualny cas vo formate hodiny:minuty
export function getCurrentTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// funkcia vrati cele meno pouzivatela podla zadaneho nicku
export function get_name_from_nick(nickname, usersList = users) {
  if (!nickname) return ''
  const cleanNick = nickname.startsWith('@') ? nickname.slice(1) : nickname
  const user = usersList.find((u) => u.nick === cleanNick || u.nick === nickname)
  return user ? user.name : nickname
}

// funkcia zobrazi uspesnu notifikaciu
export function notifySuccess(message) {
  Notify.create({
    type: 'positive',
    message,
  })
}

// funkcia zobrazi chybovu notifikaciu
export function notifyError(message) {
  Notify.create({
    type: 'negative',
    message,
  })
}

// funkcia zobrazi varovnu notifikaciu
export function notifyWarning(message) {
  Notify.create({
    type: 'warning',
    message,
  })
}
