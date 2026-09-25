import { defineStore } from 'pinia'
import { Notify, Dialog } from 'quasar'

// jednoduchy store pre spravu kanalov a pouzivatelov
export const useChatStore = defineStore('chat', {
  state: () => ({
    // aktualne prihlaseny pouzivatel
    currentUser: '@moj_nick',

    // meno aktualne vybraneho kanala
    activeChannelName: 'general',

    // predvoleny zoznam kanalov pre prezentaciu
    channels: [
      {
        name: 'general',
        isPrivate: false,
        createdBy: '@moj_nick',
        description: 'Vseobecny kanal pre novinky a pokec.',
        members: [
          { name: '@moj_nick', role: 'admin' },
          { name: 'jozef', role: 'member' },
          { name: 'ed', role: 'member' },
          { name: 'peter', role: 'member' },
        ],
      },
      {
        name: 'test1',
        isPrivate: true,
        createdBy: '@moj_nick',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        members: [
          { name: '@moj_nick', role: 'admin' },
          { name: 'ed', role: 'member' },
        ],
      },
      {
        name: 'test2',
        isPrivate: false,
        createdBy: 'jozef',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        members: [
          { name: 'jozef', role: 'admin' },
          { name: '@moj_nick', role: 'member' },
          { name: 'peter', role: 'member' },
        ],
      },
    ],
  }),

  getters: {
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
      const channel = state.channels.find((c) => c.name === state.activeChannelName)
      if (!channel) return false
      return channel.createdBy === state.currentUser
    },
  },

  actions: {
    // funkcia na prepnutie vybraneho kanala
    selectChannel(name) {
      this.activeChannelName = name
    },

    // vytvorenie alebo pridanie sa do kanala cez /join
    joinChannel(channelName, isPrivate = false) {
      // ocistenie nazvu kanala od mriezky a medzier
      const cleanName = channelName.replace('#', '').trim()

      if (!cleanName) {
        Notify.create({ type: 'warning', message: 'Zadajte platny nazov kanala!' })
        return
      }

      // kontrola ci kanal s takym menom uz existuje
      const existingChannel = this.channels.find((c) => c.name === cleanName)

      if (existingChannel) {
        // kanal uz existuje, sprava Kanal s menom --- uz existuje
        Notify.create({
          type: 'negative',
          message: `Kanal s menom #${cleanName} uz existuje`,
        })
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

        const typText = isPrivate ? 'sukromny' : 'verejny'
        Notify.create({
          type: 'positive',
          message: `Vytvoreny novy ${typText} kanal #${cleanName}`,
        })
      }
    },

    // zrusenie kanala spravcom cez /quit
    quitChannel(channelName = null) {
      const targetName = channelName || this.activeChannelName
      const channel = this.channels.find((c) => c.name === targetName)

      if (!channel) return

      // kontrola ci je pouzivatel spravca
      if (channel.createdBy !== this.currentUser) {
        Notify.create({
          type: 'negative',
          message: 'Iba spravca kanala moze zrusit kanal!',
        })
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
  },
})
