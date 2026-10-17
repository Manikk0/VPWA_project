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

// funkcia poziada prehliadac o povolenie zobrazovat systemove notifikacie
export function askNotificationPermission() {
  // niektore prehliadace notifikacie nepodporuju
  if (!('Notification' in window)) return

  // otazku zobrazime iba ak sa pouzivatel este nerozhodol
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// funkcia zobrazi systemovu notifikaciu prehliadaca o novej sprave
// vrati objekt notifikacie, alebo null ak sa notifikacia zobrazit nedala
export function showSystemNotification(channelName, sender, text) {
  // prehliadac notifikacie nepodporuje alebo ich pouzivatel nepovolil
  if (!('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null

  // do notifikacie dame iba cast spravy (najviac 60 znakov)
  let shortText = text
  if (text.length > 60) {
    shortText = text.slice(0, 60) + '...'
  }

  // nadpis: odosielatel a kanal, telo: cast spravy
  const notification = new Notification(`${sender} v #${channelName}`, {
    body: shortText,
    icon: 'icons/favicon-128x128.png',
  })
  return notification
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
