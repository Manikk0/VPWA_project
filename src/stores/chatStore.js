import { defineStore } from 'pinia'
import { Dialog } from 'quasar'
import { users, channels, messages } from '@/mockData'
import {
  getCurrentTime,
  get_name_from_nick,
  getUserStatus,
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyNewMessage,
  notifyInfo,
} from '@/utils/helper_functions'

// jednoduchy store pre spravu kanalov a pouzivatelov
export const useChatStore = defineStore('chat', {
  state: () => ({
    // aktualne prihlaseny pouzivatel (predvolene ziadny, nutne sa prihlasit)
    currentUser: null,

    // zoznam vsetkych registrovanych pouzivatelov s detailami
    users: users,

    // zoznam vsetkych registrovanych pouzivatelov
    allUsers: users.map((u) => u.nick),

    // meno aktualne vybraneho kanala
    activeChannelName: 'general',

    // predvoleny zoznam kanalov
    channels: channels,

    // ulozisko sprav pre jednotlive kanaly
    messages: messages,

    // pocet sprav v kazdom kanali v case, ked sa pouzivatel prepol do offline
    offlineMessageCounts: {},

    // pocet zobrazenych sprav pre kazdy kanal - defaultne 10 najnovsich
    visibleMessageCounts: {},

    // slovnik pre vlastne poradie kanalov pouzivatelov { nick: ['general', 'test1'] }
    userChannelOrders: {},

    // slovnik pre zvyraznene (nove) kanaly pouzivatelov { nick: ['test1'] }
    highlightedChannels: {},

    // slovnik pre pisucich pouzivatelov v kanaloch { general: ['ed', 'mara'] }
    typingUsers: {},

    // slovnik pre rozpisane texty sprav pouzivatelov { general: { ed: 'Ahoj...' } }
    typingDrafts: {},
  }),

  getters: {
    // vrati cele meno aktualne prihlaseneho pouzivatela
    currentUserName: (state) => {
      return get_name_from_nick(state.currentUser, state.users)
    },

    // vrati zoznam pisucich pouzivatelov pre aktualne vybrany kanal
    currentTypingUsers(state) {
      return state.typingUsers[state.activeChannelName] || []
    },

    // vrati stav aktualne prihlaseneho pouzivatela (Online, DND, Offline)
    currentUserStatus: (state) => {
      return getUserStatus(state.currentUser, state.users)
    },

    // vrati ci ma prihlaseny pouzivatel zapnute notifikacie iba pre spravy s jeho @nick
    currentUserOnlyMentions: (state) => {
      const user = state.users.find((u) => u.nick === state.currentUser)
      // ak pouzivatel nema nastavenie, berieme ze chce vsetky notifikacie
      if (!user || !user.onlyMentions) return false
      return true
    },

    // vrati sformatovany text pisucich pouzivatelov pre aktualne vybrany kanal
    activeTypingText() {
      const usersList = this.typingUsers[this.activeChannelName] || []
      if (usersList.length === 0) return ''

      if (usersList.length === 1) {
        return `${usersList[0]} práve píše správu...`
      } else if (usersList.length === 2) {
        return `${usersList[0]}, ${usersList[1]} práve píšu správu...`
      } else {
        return 'Viacerí používatelia práve píšu správu...'
      }
    },

    // vrati zoznam sprav pre aktualne vybrany kanal (podla poctu nacitanych sprav)
    activeMessages() {
      let allMessages = this.messages[this.activeChannelName] || []
      const visibleCount = this.visibleMessageCounts[this.activeChannelName] || 10

      // 1. krok: ak je pouzivatel offline, odstranime z celej historie spravy,
      // ktore prisli az po prepnuti do offline
      if (this.currentUserStatus === 'Offline') {
        const count = this.offlineMessageCounts[this.activeChannelName]
        if (count !== undefined) {
          allMessages = allMessages.slice(0, count)
        }
      }

      // 2. krok: z ostatnych sprav vezmeme iba poslednych `visibleCount` (kvoli infinite scrollu)
      const startIndex = Math.max(0, allMessages.length - visibleCount)
      return allMessages.slice(startIndex)
    },

    // vrati iba kanaly, v ktorych je prihlaseny pouzivatel clenom
    myChannels: (state) => {
      const result = []
      for (const channel of state.channels) {
        // hladame ci je pouzivatel v zozname clenov kanala
        const isMember = channel.members.some((m) => m.name === state.currentUser)
        if (isMember) {
          result.push(channel)
        }
      }

      // ak ma pouzivatel ulozene vlastne poradie kanalov, zoradime ich podla neho
      const userOrder = state.userChannelOrders[state.currentUser]
      if (userOrder && userOrder.length > 0) {
        result.sort((a, b) => {
          const indexA = userOrder.indexOf(a.name)
          const indexB = userOrder.indexOf(b.name)

          // ak kanal v poradi chyba, dame ho az na koniec
          const posA = indexA !== -1 ? indexA : 999
          const posB = indexB !== -1 ? indexB : 999

          return posA - posB
        })
      }

      return result
    },

    // vrati objekt aktualne vybraneho kanala (iba ak je v nom pouzivatel clenom)
    activeChannel() {
      return this.myChannels.find((c) => c.name === this.activeChannelName)
    },

    // zisti ci je prihlaseny pouzivatel spravcom vybraneho kanala
    isCurrentAdmin: (state) => {
      if (!state.currentUser) return false
      const channel = state.channels.find((c) => c.name === state.activeChannelName)
      if (!channel) return false
      return channel.createdBy === state.currentUser
    },
  },

  actions: {
    // funkcia na odhlasenie pouzivatela
    logout() {
      this.currentUser = null
    },

    // zmena stavu prihlaseneho pouzivatela (Online, DND, Offline)
    setStatus(newStatus) {
      const user = this.users.find((u) => u.nick === this.currentUser)
      if (!user) return

      // ak pouzivatel klikol na stav, ktory uz ma, nic nemenime
      if (user.status === newStatus) return

      const wasOffline = user.status === 'Offline'

      // pri prepnuti do offline si zapamatame, kolko sprav bolo v kazdom kanali
      if (newStatus === 'Offline' && !wasOffline) {
        this.offlineMessageCounts = {}
        for (const channel of this.myChannels) {
          const channelMessages = this.messages[channel.name] || []
          this.offlineMessageCounts[channel.name] = channelMessages.length
        }
      }

      user.status = newStatus

      // po navrate z offline sa kanaly aktualizuju
      if (wasOffline && newStatus !== 'Offline') {
        this.offlineMessageCounts = {}
      }

      // kratka informacna notifikacia podla noveho stavu
      if (newStatus === 'DND') {
        notifyInfo('Nerušiť – upozornenia na nové správy sú vypnuté')
      } else if (newStatus === 'Offline') {
        notifyInfo('Ste offline – nové správy sa nezobrazujú')
      } else if (wasOffline) {
        notifyInfo('Ste opäť online, kanály boli aktualizované')
      } else {
        notifyInfo('Ste online – upozornenia na nové správy sú zapnuté')
      }
    },

    // nastavenie stavu pisania a rozpisanej spravy pre pouzivatela v kanali
    setTyping(channelName, nick, isTyping, draftText = '') {
      if (!this.typingUsers[channelName]) {
        this.typingUsers[channelName] = []
      }
      if (!this.typingDrafts[channelName]) {
        this.typingDrafts[channelName] = {}
      }

      if (isTyping) {
        if (!this.typingUsers[channelName].includes(nick)) {
          this.typingUsers[channelName].push(nick)
        }
        this.typingDrafts[channelName][nick] = draftText
      } else {
        this.typingUsers[channelName] = this.typingUsers[channelName].filter((n) => n !== nick)
        delete this.typingDrafts[channelName][nick]
      }
    },

    // vrati rozpisany text spravy daneho pouzivatela v aktualnom kanali
    getTypingDraft(nick) {
      if (!this.activeChannelName || !this.typingDrafts[this.activeChannelName]) {
        return ''
      }
      return this.typingDrafts[this.activeChannelName][nick] || ''
    },

    // zapnutie / vypnutie notifikacii iba pre spravy s @nick
    setOnlyMentions(value) {
      const user = this.users.find((u) => u.nick === this.currentUser)
      if (!user) return
      user.onlyMentions = value
    },

    // prijatie novej spravy od ineho pouzivatela
    receiveMessage(channelName, sender, text) {
      if (!this.messages[channelName]) {
        this.messages[channelName] = []
      }

      // sprava sa ulozi vzdy, aj ked je pouzivatel offline
      this.messages[channelName].push({
        user: sender,
        time: getCurrentTime(),
        text: text,
      })

      // ked pouzivatel posle spravu, zrusime jeho stav pisania
      this.setTyping(channelName, sender, false)

      // zvysime pocet viditelnych sprav, aby nova sprava nevytlacila najstarsiu z obrazovky
      this.increaseVisibleCount(channelName)

      // upozornenie zobrazime iba ak je pouzivatel online
      // a sprava prisla do ineho kanala, nez ktory ma prave otvoreny
      if (this.currentUserStatus === 'Online' && channelName !== this.activeChannelName) {
        // ak ma pouzivatel zapnute notifikacie iba pre adresovane spravy, skontrolujeme ci sprava obsahuje jeho @nick
        if (this.currentUserOnlyMentions) {
          const isMentioned = text.includes(`@${this.currentUser}`)
          if (isMentioned) {
            notifyNewMessage(channelName, sender, text)
          }
        } else {
          notifyNewMessage(channelName, sender, text)
        }
      }
    },

    // funkcia na nacitanie dalsej davky starsich sprav pre aktualny kanal
    loadOlderMessages() {
      if (!this.activeChannelName) return false

      const allMessages = this.messages[this.activeChannelName] || []
      const currentCount = this.visibleMessageCounts[this.activeChannelName] || 10

      // ak uz mame nacitane vsetky spravy v kanali, vratime false kedze ziadne dalsie nie su
      if (currentCount >= allMessages.length) {
        return false
      }

      // pridame dalsich 10 sprav do viditelneho poctu pre tento kanal
      this.visibleMessageCounts[this.activeChannelName] = currentCount + 10
      return true
    },

    // funkcia na prepnutie vybraneho kanala
    selectChannel(name) {
      this.activeChannelName = name

      // po rozkliknuti kanala zrusime jeho zvyraznenie pre aktualneho pouzivatela
      if (this.currentUser && this.highlightedChannels[this.currentUser]) {
        this.highlightedChannels[this.currentUser] = this.highlightedChannels[
          this.currentUser
        ].filter((ch) => ch !== name)
      }
    },

    // zisti ci je kanal zvyrazneny pre prihlaseneho pouzivatela
    isChannelHighlighted(channelName) {
      if (!this.currentUser || !this.highlightedChannels[this.currentUser]) {
        return false
      }
      return this.highlightedChannels[this.currentUser].includes(channelName)
    },

    // funkcia na rucnu zmenu poradia kanalov
    updateChannelOrder(newOrder) {
      if (!this.currentUser) return
      this.userChannelOrders[this.currentUser] = newOrder
    },

    // prepne na prvy nezvyrazneny kanal pouzivatela, ak ziadny nezvyrazneny nema tak na prvy kanal
    selectFirstChannel() {
      if (this.myChannels.length > 0) {
        // najprv skusime najst kanal, ktory nie je zvyrazneny (aby sa novy kanal neotvoril automaticky)
        const regularChannel = this.myChannels.find((c) => !this.isChannelHighlighted(c.name))

        if (regularChannel) {
          this.activeChannelName = regularChannel.name
        } else {
          this.activeChannelName = this.myChannels[0].name
        }
      } else {
        this.activeChannelName = ''
      }
    },

    // vytvorenie alebo pridanie sa do kanala cez /join
    joinChannel(channelName, isPrivate = false) {
      // ocistenie nazvu kanala od mriezky a medzier
      const cleanName = channelName.replace('#', '').trim()

      if (!cleanName) {
        notifyWarning('Zadajte platny nazov kanala!')
        return
      }

      // kontrola ci kanal s takym menom uz existuje
      const existingChannel = this.channels.find((c) => c.name === cleanName)

      if (existingChannel) {
        // kanal uz existuje - zistime ci v nom pouzivatel uz je
        const isMember = existingChannel.members.some((m) => m.name === this.currentUser)

        if (isMember) {
          // pouzivatel uz je clenom, iba ho prepneme do kanala
          this.selectChannel(cleanName)
          notifyInfo(`Už ste členom kanála #${cleanName}`)
          return
        }

        // pouzivatel s trvalym banom sa do kanala nemoze vratit
        if (existingChannel.bannedUsers.includes(this.currentUser)) {
          notifyError(`V kanáli #${cleanName} máte trvalý ban, vrátiť vás môže iba správca`)
          return
        }

        // do sukromneho kanala sa neda pridat cez /join, pridat moze iba spravca cez /invite
        if (existingChannel.isPrivate) {
          notifyError(`Kanál #${cleanName} je súkromný, pridať vás môže iba jeho správca`)
          return
        }

        // verejny kanal - pridame pouzivatela medzi clenov a prepneme ho don
        existingChannel.members.push({ name: this.currentUser, role: 'member' })
        this.selectChannel(cleanName)
        notifySuccess(`Pridali ste sa do kanála #${cleanName}`)
      } else {
        // novy kanal
        const newChannel = {
          name: cleanName,
          isPrivate: Boolean(isPrivate),
          createdBy: this.currentUser,
          description: '',
          members: [{ name: this.currentUser, role: 'admin' }],
          bannedUsers: [],
          kickVotes: {},
        }
        this.channels.push(newChannel)
        this.activeChannelName = cleanName

        // inicializacia prazdneho zoznamu sprav pre novovytvoreny kanal
        if (!this.messages[cleanName]) {
          this.messages[cleanName] = []
        }

        const typText = isPrivate ? 'sukromny' : 'verejny'
        notifySuccess(`Vytvoreny novy ${typText} kanal #${cleanName}`)
      }
    },

    // zrusenie kanala spravcom cez /quit
    quitChannel(channelName = null) {
      const targetName = channelName || this.activeChannelName
      const channel = this.channels.find((c) => c.name === targetName)

      if (!channel) return

      // kontrola ci je pouzivatel spravca
      if (channel.createdBy !== this.currentUser) {
        notifyError('Iba spravca kanala moze zrusit kanal!')
        return
      }

      // spravca rusi kanal, takze zanikne pre vsetkych clenov
      this.deleteChannel(targetName)
    },

    // uplne zmazanie kanala aj s jeho spravami (kanal zanikne pre vsetkych)
    deleteChannel(channelName) {
      // odstranenie kanala zo zoznamu vsetkych kanalov
      this.channels = this.channels.filter((c) => c.name !== channelName)
      // odstranenie sprav kanala
      delete this.messages[channelName]

      // prepneme na iny kanal pouzivatela
      this.selectFirstChannel()

      // popup sprava Kanal zanikol
      Dialog.create({
        title: 'Kanal zanikol',
        message: `Kanal #${channelName} zanikol`,
        color: 'negative',
      })
    },

    // opustenie členstva cez /cancel
    cancelChannel(channelName = null) {
      const targetName = channelName || this.activeChannelName
      const channel = this.channels.find((c) => c.name === targetName)

      if (!channel) return

      // ak je pouzivatel spravca kanala, kanal zanika pre vsetkych
      if (channel.createdBy === this.currentUser) {
        this.deleteChannel(targetName)
        return
      }

      // inak odoberieme iba aktualneho pouzivatela zo zoznamu clenov
      channel.members = channel.members.filter((m) => m.name !== this.currentUser)

      // prepneme na iny kanal pouzivatela
      this.selectFirstChannel()

      Dialog.create({
        title: 'Opustil si kanal',
        message: `Opustil si kanal #${targetName}`,
        color: 'warning',
      })
    },

    // funkcia na odoslanie spravy do aktualneho kanala
    sendMessage(text) {
      // ak nie je vybrany ziadny kanal (kde je pouzivatel clenom) alebo je text prazdny, nic nespravime
      if (!this.activeChannel || !text || !text.trim()) return

      // v offline stave sa spravy neodosielaju
      if (this.currentUserStatus === 'Offline') {
        notifyWarning('Ste offline, správu nie je možné odoslať')
        return
      }

      // ak nahodou pre dany kanal este neexistuje pole sprav v dictionary, vytvorime ho
      if (!this.messages[this.activeChannelName]) {
        this.messages[this.activeChannelName] = []
      }

      // vytvorenie noveho objektu spravy s aktualnym casom z helper funkcie
      const newMessage = {
        user: this.currentUser,
        time: getCurrentTime(),
        text: text.trim(),
      }

      // pridanie spravy do zoznamu sprav pre aktualny kanal
      this.messages[this.activeChannelName].push(newMessage)

      // zvysime pocet viditelnych sprav, aby nova sprava nevytlacila najstarsiu z obrazovky
      this.increaseVisibleCount(this.activeChannelName)
    },

    // zvysi pocet viditelnych sprav v kanali o 1 (ak este nie je nastaveny, zacina sa od 10)
    increaseVisibleCount(channelName) {
      const currentCount = this.visibleMessageCounts[channelName] || 10
      this.visibleMessageCounts[channelName] = currentCount + 1
    },

    // vyhodenie pouzivatela z verejneho kanala cez /kick
    kickUser(nickName) {
      if (!this.activeChannel || !nickName) return

      const channel = this.activeChannel

      // /kick funguje iba vo verejnom kanali
      if (channel.isPrivate) {
        notifyError('Príkaz /kick funguje iba vo verejnom kanáli. V súkromnom použite /revoke')
        return
      }

      // sam seba vyhodit nemozeme
      if (nickName === this.currentUser) {
        notifyWarning('Nemôžete vyhodiť sám seba. Na opustenie kanála použite /cancel')
        return
      }

      // nemozeme vyhodit spravcu kanala
      if (nickName === channel.createdBy) {
        notifyWarning('Nemôžete vyhodiť správcu kanála!')
        return
      }

      // kontrola ci je pouzivatel clenom kanala
      const isMember = channel.members.some((m) => m.name === nickName)
      if (!isMember) {
        notifyError(`Používateľ ${nickName} sa v tomto kanáli nenachádza!`)
        return
      }

      // spravca vyhadzuje natrvalo hned
      if (this.isCurrentAdmin) {
        this.banUser(channel, nickName)
        notifySuccess(`Používateľ ${nickName} bol správcom natrvalo vyhodený z #${channel.name}`)
        return
      }

      // bezny clen prida hlas za vyhodenie
      if (!channel.kickVotes[nickName]) {
        channel.kickVotes[nickName] = []
      }
      const votes = channel.kickVotes[nickName]

      // jeden clen moze za toho isteho pouzivatela hlasovat iba raz
      if (votes.includes(this.currentUser)) {
        notifyWarning(`Za vyhodenie ${nickName} ste už hlasovali (${votes.length}/3)`)
        return
      }

      votes.push(this.currentUser)

      // ak su aspon 3 hlasy, pouzivatel dostane trvaly ban
      if (votes.length >= 3) {
        this.banUser(channel, nickName)
        notifySuccess(`Používateľ ${nickName} dostal 3 hlasy a má trvalý ban v #${channel.name}`)
      } else {
        notifyInfo(`Hlasovali ste za vyhodenie ${nickName} (${votes.length}/3)`)
      }
    },

    banUser(channel, nickName) {
      channel.members = channel.members.filter((m) => m.name !== nickName)

      if (!channel.bannedUsers.includes(nickName)) {
        channel.bannedUsers.push(nickName)
      }

      delete channel.kickVotes[nickName]
    },

    // odobratie clena spravcom zo sukromneho kanala
    revokeUser(nickName) {
      if (!this.activeChannel) {
        return
      }

      if (!nickName) {
        notifyWarning('Zadajte nick používateľa: /revoke @user')
        return
      }

      // /revoke funguje iba v sukromnom kanali
      if (!this.activeChannel.isPrivate || !this.isCurrentAdmin) {
        notifyError('Prikaz /revoke moze pouzit iba spravca kanala a iba v sukromnom kanali!')
        return
      }

      // spravca nemoze odobrat sam seba
      if (nickName === this.currentUser) {
        notifyWarning('Nemôžete odobrať sám seba. Na zrušenie kanála použite /quit')
        return
      }

      // najdeme pouzivatela v zozname clenov kanala
      const memberIndex = this.activeChannel.members.findIndex((m) => m.name === nickName)

      // ak pouzivatel nie je clenom kanala, vypiseme chybu
      if (memberIndex === -1) {
        notifyError(`Používateľ ${nickName} nie je členom kanála #${this.activeChannelName}!`)
        return
      }

      // odstranime pouzivatela zo zoznamu clenov
      this.activeChannel.members.splice(memberIndex, 1)

      notifySuccess(`Používateľ ${nickName} bol odobratý z kanála #${this.activeChannelName}`)
    },

    // pozvanie pouzivatela do aktualneho kanala cez /invite @user
    inviteUser(nickName) {
      if (!this.activeChannel) {
        return
      }

      if (!nickName) {
        notifyWarning('Zadajte nick používateľa: /invite @user')
        return
      }

      // kontrola ci user existuje v zozname registrovanych pouzivatelov
      const userExists = this.allUsers.includes(nickName)
      if (!userExists) {
        notifyError(`Používateľ ${nickName} neexistuje!`)
        return
      }

      // ak je kanal sukromny, kontrolujeme ci je aktualny pouzivatel spravcom kanalu
      if (this.activeChannel.isPrivate && !this.isCurrentAdmin) {
        notifyError('Iba správca môže pridávať členov do súkromného kanála!')
        return
      }

      if (this.activeChannel.bannedUsers.includes(nickName)) {
        if (!this.isCurrentAdmin) {
          notifyError(
            `Používateľ ${nickName} má v tomto kanáli ban, obnoviť prístup môže iba správca!`,
          )
          return
        }

        // spravca rusi ban
        this.activeChannel.bannedUsers = this.activeChannel.bannedUsers.filter(
          (n) => n !== nickName,
        )
        notifyInfo(`Ban pre používateľa ${nickName} bol zrušený`)
      }

      // kontrola ci uz pouzivatel nahodou nie je clenom kanala
      const isAlreadyMember = this.activeChannel.members.some((m) => m.name === nickName)
      if (isAlreadyMember) {
        notifyWarning(`Používateľ ${nickName} už je v tomto kanáli!`)
        return
      }

      // ak vsetko preslo, pridame usera do zoznamu clenov
      this.activeChannel.members.push({
        name: nickName,
        role: 'member',
      })

      // topovanie - pridame alebo posunieme kanal na zaciatok poradia pre pozvaneho pouzivatela
      if (!this.userChannelOrders[nickName]) {
        // ak pozvany pouzivatel este nema vlastne poradie, vytvorime ho z jeho kanalov
        const userChannels = this.channels
          .filter((c) => c.members.some((m) => m.name === nickName))
          .map((c) => c.name)
        this.userChannelOrders[nickName] = userChannels
      }

      // vyberieme kanal z existujuceho poradia a dame ho na prve miesto
      const currentOrder = this.userChannelOrders[nickName].filter(
        (ch) => ch !== this.activeChannelName,
      )
      this.userChannelOrders[nickName] = [this.activeChannelName, ...currentOrder]

      // pridame kanal do zoznamu zvyraznenych kanalov pre pozvaneho pouzivatela
      if (!this.highlightedChannels[nickName]) {
        this.highlightedChannels[nickName] = []
      }
      if (!this.highlightedChannels[nickName].includes(this.activeChannelName)) {
        this.highlightedChannels[nickName].push(this.activeChannelName)
      }

      notifySuccess(
        `Používateľ ${nickName} bol úspešne pridaný do kanála #${this.activeChannelName}`,
      )
    },
  },
})
