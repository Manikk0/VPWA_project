import { defineStore } from 'pinia'
import { Dialog } from 'quasar'
import { users, channels, messages } from '@/mockData'
import {
  getCurrentTime,
  get_name_from_nick,
  notifySuccess,
  notifyError,
  notifyWarning,
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
  }),

  getters: {
    // vrati cele meno aktualne prihlaseneho pouzivatela
    currentUserName: (state) => {
      return get_name_from_nick(state.currentUser, state.users)
    },

    // vrati zoznam sprav pre aktualne vybrany kanal
    activeMessages: (state) => {
      return state.messages[state.activeChannelName] || []
    },

    // vrati objekt aktualne vybraneho kanala
    activeChannel: (state) => {
      let found = state.channels.find((c) => c.name === state.activeChannelName)
      if (!found && state.channels.length > 0) {
        found = state.channels[0]
      }
      return found
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

    // funkcia na prepnutie vybraneho kanala
    selectChannel(name) {
      this.activeChannelName = name
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

      // odstranenie kanala zo zoznamu
      this.channels = this.channels.filter((c) => c.name !== targetName)
      // ak este zostali nejake kanaly prepneme na prvy z nich
      if (this.channels.length > 0) {
        this.activeChannelName = this.channels[0].name
      } else {
        this.activeChannelName = ''
      }

      // popup sprava Kanal zanikol
      Dialog.create({
        title: 'Kanal zanikol',
        message: 'Kanal zanikol',
        color: 'negative',
      })
    },

    // opustenie členstva cez /cancel
    cancelChannel(channelName = null) {
      const targetName = channelName || this.activeChannelName
      const channel = this.channels.find((c) => c.name === targetName)

      if (!channel) return

      // kanal zmizne zo zoznamu vlavo pre daneho pouzivatela
      this.channels = this.channels.filter((c) => c.name !== targetName)

      if (this.channels.length > 0) {
        this.activeChannelName = this.channels[0].name
      } else {
        this.activeChannelName = ''
      }

      // ak je pouzivatel spravca kanala, kanal zanika
      if (channel.createdBy === this.currentUser) {
        Dialog.create({
          title: 'Kanal zanikol',
          message: 'Kanal zanikol',
          color: 'negative',
        })
      } else {
        // ak pouzivatel nie je spravca, sprava Opustil si kanal
        channel.members = channel.members.filter((m) => m.name !== this.currentUser)

        Dialog.create({
          title: 'Opustil si kanal',
          message: 'Opustil si kanal',
          color: 'warning',
        })
      }
    },

    // funkcia na odoslanie spravy do aktualneho kanala
    sendMessage(text) {
      // ak nie je vybrany ziadny kanal alebo je text prazdny, nic nespravime
      if (!this.activeChannelName || !text || !text.trim()) return

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
      // TBA
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
