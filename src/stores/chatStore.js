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
  }),

  getters: {
    // vrati cele meno aktualne prihlaseneho pouzivatela
    currentUserName: (state) => {
      return get_name_from_nick(state.currentUser, state.users)
    },

    // vrati stav aktualne prihlaseneho pouzivatela (Online, DND, Offline)
    currentUserStatus: (state) => {
      return getUserStatus(state.currentUser, state.users)
    },

    // vrati zoznam sprav pre aktualne vybrany kanal
    activeMessages() {
      const allMessages = this.messages[this.activeChannelName] || []

      // ak je pouzivatel offline, zobrazime iba spravy, ktore prisli pred prepnutim do offline
      if (this.currentUserStatus === 'Offline') {
        const count = this.offlineMessageCounts[this.activeChannelName]
        if (count !== undefined) {
          return allMessages.slice(0, count)
        }
      }

      return allMessages
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

      // upozornenie zobrazime iba ak je pouzivatel online
      // a sprava prisla do ineho kanala, nez ktory ma prave otvoreny
      if (this.currentUserStatus === 'Online' && channelName !== this.activeChannelName) {
        notifyNewMessage(channelName, sender, text)
      }
    },

    // funkcia na prepnutie vybraneho kanala
    selectChannel(name) {
      this.activeChannelName = name
    },

    // prepne na prvy kanal pouzivatela, ak ziadny nema tak nastavi prazdny nazov
    selectFirstChannel() {
      if (this.myChannels.length > 0) {
        this.activeChannelName = this.myChannels[0].name
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
        // kanal uz existuje, sprava Kanal s menom --- uz existuje
        notifyError(`Kanal s menom #${cleanName} uz existuje`)
      } else {
        // novy kanal
        const newChannel = {
          name: cleanName,
          isPrivate: Boolean(isPrivate),
          createdBy: this.currentUser,
          description: '',
          members: [{ name: this.currentUser, role: 'admin' }],
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
    },

    // vyhodenie pouzivatela z kanala
    kickUser(nickName) {
      if (!this.activeChannel || !nickName) return

      // najdeme pouzivatela v zozname clenov podla nicku
      const memberIndex = this.activeChannel.members.findIndex((m) => m.name === nickName)

      if (memberIndex === -1) {
        notifyError(`Pouzivatel ${nickName} sa v tomto kanali nenachadza!`)
        return
      }

      // vymazeme pouzivatela zo zoznamu clenov
      this.activeChannel.members.splice(memberIndex, 1)

      notifySuccess(`Pouzivatel ${nickName} bol vyhodeny z kanala #${this.activeChannelName}`)
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

      notifySuccess(
        `Používateľ ${nickName} bol úspešne pridaný do kanála #${this.activeChannelName}`,
      )
    },
  },
})
