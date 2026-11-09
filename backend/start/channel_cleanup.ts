import { DateTime } from 'luxon'
import Channel from '#models/channel'
import Message from '#models/message'
import { closeChannelRoom } from '#services/socket'

// kanal bez novej spravy dlhsie ako tento pocet dni zanikne
const INACTIVE_DAYS = 30

// kazdu hodinu kontrolujeme neaktivne kanaly (v milisekundach)
const CHECK_INTERVAL = 60 * 60 * 1000

// zmaze vsetky kanaly, v ktorych nebola pridana nova sprava viac ako 30 dni, po zmazani sa da nazov kanala pouzit pre novy kanal
async function deleteInactiveChannels() {
  // cas pred 30 dnami - co je starsie, je neaktivne
  const limit = DateTime.now().minus({ days: INACTIVE_DAYS })

  const channels = await Channel.all()

  for (const channel of channels) {
    // najnovsia sprava v kanali (podla stlpca created_at)
    const lastMessage = await Message.query()
      .where('channelId', channel.id)
      .orderBy('createdAt', 'desc')
      .first()

    // ak v kanali este nie je ziadna sprava, berieme cas vytvorenia kanala
    let lastActivity = channel.createdAt
    if (lastMessage) {
      lastActivity = lastMessage.createdAt
    }

    // casy porovnavame v milisekundach
    if (lastActivity.toMillis() < limit.toMillis()) {
      // clenstva, spravy, bany a hlasy sa zmazu v databaze cez CASCADE
      await channel.delete()
      // pripojenym clenom kanal hned zmizne zo zoznamu
      closeChannelRoom(channel.id, channel.name)
      console.log(`Kanal #${channel.name} zanikol - viac ako ${INACTIVE_DAYS} dni bez novej spravy`)
    }
  }
}

// kontrola hned po spusteni servera
deleteInactiveChannels().catch((error) => {
  console.error('Nepodarilo sa zmazat neaktivne kanaly', error)
})

// potom kontrola pravidelne kazdy interval
setInterval(() => {
  deleteInactiveChannels().catch((error) => {
    console.error('Nepodarilo sa zmazat neaktivne kanaly', error)
  })
}, CHECK_INTERVAL)
