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

// funkcia vrati stav pouzivatela (Online, DND, Offline) podla nicku
export function getUserStatus(nickname, usersList = users) {
  const user = usersList.find((u) => u.nick === nickname)
  // ak pouzivatel nema nastaveny stav, berieme ze je online
  if (!user || !user.status) return 'Online'
  return user.status
}

// funkcia zobrazi upozornenie o novej sprave v inom kanali
export function notifyNewMessage(channelName, sender, text) {
  Notify.create({
    color: 'white',
    textColor: 'pine-teal',
    icon: 'chat',
    iconColor: 'hunter-green',
    position: 'top-right',
    classes: 'notify-message',
    // prvy riadok: kto a kam poslal spravu
    message: `${sender} v #${channelName}`,
    // druhy riadok: samotny text spravy
    caption: text,
  })
}

// funkcia zobrazi kratku informacnu notifikaciu
export function notifyInfo(message) {
  Notify.create({
    color: 'white',
    textColor: 'pine-teal',
    icon: 'info',
    iconColor: 'fern',
    classes: 'notify-info',
    timeout: 2500,
    message,
  })
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
