import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import User from '#models/user'
import Channel from '#models/channel'
import Message from '#models/message'
import ChannelBan from '#models/channel_ban'
import KickVote from '#models/kick_vote'
import MessageMention from '#models/message_mention'

// testovacie data
// spustenie: node ace migration:fresh --seed (zmaze vsetky tabulky, vytvori ich znova a naplni datami)

// heslo pre vsetkych testovacich pouzivatelov
const TEST_PASSWORD = 'heslo123'

// testovaci pouzivatelia
// notificationPref moze byt 'all', 'mentions_only' alebo 'none'
const users = [
  {
    firstName: 'Juraj',
    lastName: 'Metlicka',
    nickname: 'juro',
    email: 'juro@test.sk',
    status: 'online',
    notificationPref: 'all' as const,
  },
  {
    firstName: 'Jozef',
    lastName: 'Mrkvicka',
    nickname: 'jozef',
    email: 'jozef@test.sk',
    status: 'online',
    notificationPref: 'all' as const,
  },
  {
    firstName: 'Ed',
    lastName: 'Tester',
    nickname: 'ed',
    email: 'ed@test.sk',
    status: 'dnd',
    notificationPref: 'all' as const,
  },
  {
    firstName: 'Maria',
    lastName: 'Kovacova',
    nickname: 'mara',
    email: 'mara@test.sk',
    status: 'online',
    notificationPref: 'mentions_only' as const,
  },
  {
    firstName: 'Peter',
    lastName: 'Novak',
    nickname: 'peto',
    email: 'peto@test.sk',
    status: 'offline',
    notificationPref: 'all' as const,
  },
  {
    firstName: 'Zuzana',
    lastName: 'Hraskova',
    nickname: 'zuzka',
    email: 'zuzka@test.sk',
    status: 'online',
    notificationPref: 'all' as const,
  },
]

// testovacie kanaly - createdBy je spravca, members su vsetci clenovia (vratane spravcu)
const channels = [
  {
    name: 'general',
    type: 'public',
    description: 'Vseobecny kanal pre novinky a pokec.',
    createdBy: 'juro',
    members: ['juro', 'jozef', 'ed', 'mara', 'peto', 'zuzka'],
    kickVotes: [
      { target: 'ed', votedBy: 'jozef' },
      { target: 'ed', votedBy: 'mara' },
    ],
    bannedUsers: [] as string[],
  },
  {
    name: 'test1',
    type: 'private',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    createdBy: 'juro',
    members: ['juro', 'ed'],
    kickVotes: [] as { target: string; votedBy: string }[],
    bannedUsers: [] as string[],
  },
  {
    name: 'test2',
    type: 'public',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    createdBy: 'jozef',
    members: ['jozef', 'juro'],
    kickVotes: [] as { target: string; votedBy: string }[],
    bannedUsers: [] as string[],
  },
  {
    name: 'programovanie',
    type: 'public',
    description: 'Debaty o kode, chybach a skole.',
    createdBy: 'ed',
    members: ['ed', 'mara', 'peto'],
    kickVotes: [] as { target: string; votedBy: string }[],
    bannedUsers: [] as string[],
  },
  {
    name: 'tajne',
    type: 'private',
    description: 'Sukromny kanal len pre pozvanych.',
    createdBy: 'mara',
    members: ['mara', 'zuzka'],
    kickVotes: [] as { target: string; votedBy: string }[],
    bannedUsers: [] as string[],
  },
  {
    name: 'random',
    type: 'public',
    description: 'Hocico, co sa nehodi inam.',
    createdBy: 'peto',
    members: ['peto', 'juro', 'jozef', 'zuzka'],
    kickVotes: [] as { target: string; votedBy: string }[],
    bannedUsers: ['ed'],
  },
]

// testovacie spravy pre kazdy kanal
const messages = {
  general: [
    { user: 'juro', time: '08:00', text: 'Vytvoril som novy kanal #general pre vsetkych.' },
    { user: 'jozef', time: '08:05', text: 'Super, diky @juro!' },
    { user: 'mara', time: '08:10', text: 'Ahoojte.' },
    { user: 'ed', time: '08:15', text: 'Ahoj, ako to ide?' },
    { user: 'peto', time: '08:20', text: 'Ja som zabudol ze dnes je to odovzdanie' },
    { user: 'zuzka', time: '08:30', text: 'Ved som ti to spominala' },
    { user: 'juro', time: '09:00', text: 'aaaaaaaaaaaaaaaaaaa' },
    { user: 'jozef', time: '09:15', text: 'co sa deje ???' },
    { user: 'mara', time: '09:30', text: 'idk' },
    { user: 'ed', time: '10:00', text: 'Funguje to?' },
    { user: 'peto', time: '10:30', text: 'Co?' },
    { user: 'zuzka', time: '10:45', text: 'No ved ten chat mysli' },
    { user: 'juro', time: '11:00', text: 'Jasnacka, dostavam upozornenia vsetko.' },
    { user: 'jozef', time: '11:30', text: '.' },
    { user: 'mara', time: '12:00', text: 'Ide niekto na obed?' },
    { user: 'ed', time: '12:30', text: 'Ja pojdem, ale az neskor' },
    { user: 'jozef', time: '12:32', text: 'Isiel by som teraz' },
    { user: 'juro', time: '12:35', text: 'Tiez sa pridam' },
    { user: 'peto', time: '13:00', text: 'Pockajte maa, idem aj ja' },
    { user: 'zuzka', time: '13:15', text: 'mne sa neda' },
    { user: 'mara', time: '13:30', text: 'Cakame pred intrakom.' },
    { user: 'ed', time: '14:00', text: 'uz mozem aj ja' },
    { user: 'juro', time: '14:30', text: 'Skoda, my sme uz boli.' },
    { user: 'jozef', time: '15:00', text: ':<(' },
  ],
  test1: [{ user: 'ed', time: '10:15', text: 'Ahoj v sukromnom kanali test1.' }],
  test2: [],
  programovanie: [
    { user: 'ed', time: '09:00', text: 'Rano som opravil bug v logine.' },
    { user: 'mara', time: '09:05', text: '@ed super, pozriem sa na to po obede.' },
    { user: 'peto', time: '09:10', text: 'Ma niekto skusenosti s Quasarom?' },
  ],
  tajne: [{ user: 'mara', time: '18:20', text: 'Ahoj @zuzka, toto je nas sukromny kanal.' }],
  random: [
    { user: 'peto', time: '14:00', text: 'Ide niekto na obed?' },
    { user: 'zuzka', time: '14:02', text: 'Ja idem, @peto pockaj ma.' },
    { user: 'jozef', time: '14:03', text: 'Ja dnes nestiham.' },
  ],
}

// prevedie cas "14:30" na vcerajsi datum s tymto casom
function yesterdayAt(time: string) {
  const parts = time.split(':')
  return DateTime.now()
    .minus({ days: 1 })
    .set({ hour: Number(parts[0]), minute: Number(parts[1]), second: 0, millisecond: 0 })
}

export default class extends BaseSeeder {
  async run() {
    // 1. pouzivatelia - zapamatame si ich podla nicku, aby sme ich vedeli priradit ku kanalom
    const usersByNick: Record<string, User> = {}
    for (const data of users) {
      // heslo sa pri ulozeni zahashuje automaticky
      const user = await User.create({ ...data, password: TEST_PASSWORD })
      usersByNick[data.nickname] = user
    }

    // 2. kanaly, ich clenovia, bany, hlasy a spravy
    for (const data of channels) {
      const channelMessages = messages[data.name as keyof typeof messages]

      // posledna aktivita = cas poslednej spravy (ak kanal nema spravy, tak teraz)
      let lastActivityAt = DateTime.now()
      if (channelMessages.length > 0) {
        lastActivityAt = yesterdayAt(channelMessages[channelMessages.length - 1].time)
      }

      const channel = await Channel.create({
        name: data.name,
        type: data.type,
        description: data.description,
        createdBy: usersByNick[data.createdBy].id,
        lastActivityAt: lastActivityAt,
      })

      // clenovia kanala - zapis do tabulky channel_members
      for (const nick of data.members) {
        await channel.related('members').attach({
          [usersByNick[nick].id]: {
            is_highlighted: false,
            joined_at: DateTime.now().toSQL(),
          },
        })
      }

      // zabanovani pouzivatelia - zapis do tabulky channel_bans
      for (const nick of data.bannedUsers) {
        await ChannelBan.create({
          channelId: channel.id,
          userId: usersByNick[nick].id,
        })
      }

      // hlasy clenov za vyhodenie pouzivatela - zapis do tabulky kick_votes
      for (const vote of data.kickVotes) {
        await KickVote.create({
          channelId: channel.id,
          targetUserId: usersByNick[vote.target].id,
          votedByUserId: usersByNick[vote.votedBy].id,
        })
      }

      // spravy kanala a spomenutia @
      for (const message of channelMessages) {
        const createdMessage = await Message.create({
          channelId: channel.id,
          senderId: usersByNick[message.user].id,
          content: message.text,
          createdAt: yesterdayAt(message.time),
        })

        // ak text spravy obsahuje @nickname pouzivatela, vytvorime zaznam v message_mentions
        for (const [nick, userObj] of Object.entries(usersByNick)) {
          if (message.text.includes(`@${nick}`)) {
            await MessageMention.create({
              messageId: createdMessage.id,
              mentionedUserId: userObj.id,
            })
          }
        }
      }
    }
  }
}
