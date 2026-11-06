import { defineStore } from 'pinia'
import { Dialog, AppVisibility } from 'quasar'
import { users } from '@/mockData'
import {
  getCurrentTime,
  formatTime,
  get_name_from_nick,
  getUserStatus,
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  showSystemNotification,
} from '@/utils/helper_functions'
import { api } from '@/boot/axios'

const statusNames = { online: 'Online', dnd: 'DND', offline: 'Offline' }

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

    // kanaly prihlaseneho pouzivatela
    channels: [],

    // nacitane spravy pre jednotlive kanaly
    messages: {},

    // ci ma kanal na serveri este starsie spravy, ktore sme nenacitali
    hasMoreMessages: {},

    // cas (v milisekundach), kedy sa pouzivatel prepol do offline - null ak nie je offline
    // spravy, ktore prisli po tomto case, sa v offline stave nezobrazuju
    offlineSince: null,

    // slovnik pre vlastne poradie kanalov pouzivatelov { nick: ['general', 'test1'] }
    userChannelOrders: {},

    // slovnik pre zvyraznene (nove) kanaly pouzivatelov { nick: ['test1'] }
    highlightedChannels: {},

    // slovnik pre pisucich pouzivatelov v kanaloch { general: ['ed', 'mara'] }
    typingUsers: {},

    // slovnik pre rozpisane texty sprav pouzivatelov { general: { ed: 'Ahoj...' } }
    typingDrafts: {},

    // pocet sprav, o ktorych prisla notifikacia, kym aplikacia nebola viditelna
    missedMessagesCount: 0,
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

    // vrati nacitane spravy pre aktualne vybrany kanal
    activeMessages() {
      const allMessages = this.messages[this.activeChannelName] || []

      // ak pouzivatel nie je offline, zobrazime vsetky nacitane spravy
      if (this.currentUserStatus !== 'Offline' || !this.offlineSince) {
        return allMessages
      }

      // v offline stave skryjeme spravy, ktore prisli az po prepnuti do offline
      const result = []
      for (const message of allMessages) {
        if (!message.receivedAt || message.receivedAt <= this.offlineSince) {
          result.push(message)
        }
      }
      return result
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
    // registracia noveho pouzivatela - udaje sa ulozia do databazy
    // pri chybe (napr. nickname uz existuje) server vrati chybu a funkcia ju posunie dalej do AuthPage
    async register(form) {
      const response = await api.post('/auth/signup', form)
      // server vrati { data: { user, token } }
      await this.setLoggedUser(response.data.data.user, response.data.data.token)
    },

    // prihlasenie - login moze byt email alebo nickname
    async login(login, password) {
      const response = await api.post('/auth/login', { login: login, password: password })
      await this.setLoggedUser(response.data.data.user, response.data.data.token)
    },

    // obnovenie prihlasenia po obnoveni stranky (ak mame ulozeny token)
    // vrati true ak je pouzivatel stale prihlaseny, inak false
    async restoreSession() {
      const token = localStorage.getItem('token')
      if (!token) return false

      try {
        // server podla tokenu vrati udaje prihlaseneho pouzivatela
        const response = await api.get('/account/profile')
        await this.setLoggedUser(response.data.data, null)
        return true
      } catch {
        // token uz neplati (alebo server nebezi) - zmazeme ho
        localStorage.removeItem('token')
        return false
      }
    },

    // odhlasenie - token sa zrusi na serveri aj v prehliadaci
    async logout() {
      try {
        await api.post('/account/logout')
      } catch {
        // aj ked sa odhlasenie na serveri nepodari, v prehliadaci pouzivatela odhlasime
      }
      localStorage.removeItem('token')
      this.currentUser = null
      // po odhlaseni vycistime zoznam kanalov
      this.channels = []
      // po odhlaseni vynulujeme pocet zmeskanych sprav
      this.missedMessagesCount = 0
    },

    // nacitanie zoznamu kanalov prihlaseneho pouzivatela zo servera
    async fetchChannels() {
      try {
        const response = await api.get('/channels')
        // server vrati zoznam kanalov, v ktorych je prihlaseny pouzivatel clenom
        this.channels = response.data

        // ak aktualne vybrany kanal uz neexistuje medzi kanalmi pouzivatela, prepneme na prvy
        const stillInActive = this.channels.some((c) => c.name === this.activeChannelName)
        if (!stillInActive) {
          this.selectFirstChannel()
        }
      } catch {
        notifyError('Nepodarilo sa načítať kanály zo servera')
      }
    },

    // ulozenie prihlaseneho pouzivatela do store
    async setLoggedUser(user, token) {
      // token si ulozime do prehliadaca, aby pouzivatel ostal prihlaseny aj po obnoveni stranky
      if (token) {
        localStorage.setItem('token', token)
      }

      this.currentUser = user.nickname

      // docasne kanaly a spravy su zatial z mockData.js, ktore pracuju so zoznamom this.users
      // preto pouzivatela zo servera pridame / aktualizujeme aj v tomto zozname
      let existingUser = this.users.find((u) => u.nick === user.nickname)
      if (!existingUser) {
        existingUser = { nick: user.nickname }
        this.users.push(existingUser)
        this.allUsers.push(user.nickname)
      }
      existingUser.name = `${user.firstName} ${user.lastName}`
      existingUser.status = statusNames[user.status]
      existingUser.onlyMentions = user.notifyOnlyMentions

      // nacitame aktualne kanaly pouzivatela zo servera
      await this.fetchChannels()
    },

    // zmena stavu prihlaseneho pouzivatela (Online, DND, Offline)
    setStatus(newStatus) {
      const user = this.users.find((u) => u.nick === this.currentUser)
      if (!user) return

      // ak pouzivatel klikol na stav, ktory uz ma, nic nemenime
      if (user.status === newStatus) return

      const wasOffline = user.status === 'Offline'

      // pri prepnuti do offline si zapamatame cas - novsie spravy sa nebudu zobrazovat
      if (newStatus === 'Offline' && !wasOffline) {
        this.offlineSince = Date.now()
      }

      user.status = newStatus

      // po navrate z offline sa kanaly aktualizuju
      if (wasOffline && newStatus !== 'Offline') {
        this.offlineSince = null
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
      // receivedAt = kedy sprava prisla
      this.messages[channelName].push({
        user: sender,
        time: getCurrentTime(),
        text: text,
        receivedAt: Date.now(),
      })

      // ked pouzivatel posle spravu, zrusime jeho stav pisania
      this.setTyping(channelName, sender, false)

      // notifikaciu vystavime iba ak je pouzivatel online (nie DND ani offline)
      // a aplikacia nie je v stave "visible" (AppVisibility)
      if (this.currentUserStatus === 'Online' && !AppVisibility.appVisible) {
        let shouldNotify = true
        // ak ma pouzivatel zapnute notifikacie iba pre adresovane spravy, skontrolujeme ci sprava obsahuje jeho @nick
        if (this.currentUserOnlyMentions) {
          shouldNotify = text.includes(`@${this.currentUser}`)
        }

        if (shouldNotify) {
          // systemova notifikacia prehliadaca
          const notification = showSystemNotification(channelName, sender, text)

          // po kliknuti na notifikaciu sa vratime do aplikacie a otvorime kanal so spravou
          if (notification) {
            notification.onclick = () => {
              window.focus()
              this.selectChannel(channelName)
              notification.close()
            }
          }

          // zvysime pocet zmeskanych sprav
          this.missedMessagesCount++
        }
      }
    },

    // prevod spravy zo servera na tvar, ktory pouziva zobrazenie sprav (IndexPage)
    convertServerMessage(message) {
      return {
        id: message.id,
        user: message.user,
        text: message.text,
        time: formatTime(message.createdAt),
        // nicky pouzivatelov oznacenych v sprave
        mentions: message.mentions,
      }
    },

    // nacitanie najnovsich sprav kanala zo servera (pri otvoreni kanala)
    async fetchMessages(channelName) {
      const channel = this.channels.find((c) => c.name === channelName)
      if (!channel) return

      try {
        const response = await api.get(`/channels/${channel.id}/messages`)

        const loadedMessages = []
        for (const message of response.data.messages) {
          loadedMessages.push(this.convertServerMessage(message))
        }

        this.messages[channelName] = loadedMessages
        this.hasMoreMessages[channelName] = response.data.hasMore
      } catch {
        notifyError('Nepodarilo sa načítať správy zo servera')
      }
    },

    // nacitanie dalsej davky starsich sprav pre aktualny kanal (infinite scroll)
    // vrati true ak su na serveri este dalsie starsie spravy, inak false
    async loadOlderMessages() {
      const channelName = this.activeChannelName
      const channel = this.channels.find((c) => c.name === channelName)
      const currentMessages = this.messages[channelName] || []

      // ak nemame kanal alebo uz nie su starsie spravy, nie je co nacitat
      if (!channel || !this.hasMoreMessages[channelName] || currentMessages.length === 0) {
        return false
      }

      // id najstarsej nacitanej spravy - server vrati spravy starsie ako tato
      const oldestId = currentMessages[0].id

      try {
        const response = await api.get(`/channels/${channel.id}/messages`, {
          params: { before: oldestId },
        })

        const olderMessages = []
        for (const message of response.data.messages) {
          olderMessages.push(this.convertServerMessage(message))
        }

        // starsie spravy pridame na zaciatok zoznamu
        this.messages[channelName] = olderMessages.concat(this.messages[channelName])
        this.hasMoreMessages[channelName] = response.data.hasMore
        return response.data.hasMore
      } catch {
        notifyError('Nepodarilo sa načítať staršie správy')
        return false
      }
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
    async joinChannel(channelName, isPrivate = false) {
      // ocistenie nazvu kanala od mriezky a medzier
      const cleanName = channelName.replace('#', '').trim()

      if (!cleanName) {
        notifyWarning('Zadajte platny nazov kanala!')
        return
      }

      try {
        // odosleme poziadavku na server s nazvom a typom kanala (public alebo private)
        const response = await api.post('/channels/join', {
          name: cleanName,
          type: isPrivate ? 'private' : 'public',
        })

        // po uspesnom pridani alebo vytvoreni znovu nacitame kanaly zo servera
        await this.fetchChannels()

        // prepneme sa do pripojeneho alebo vytvoreneho kanala (spravy sa nacitaju v IndexPage)
        this.selectChannel(cleanName)

        if (response.data.alreadyMember) {
          notifyInfo(response.data.message)
        } else {
          notifySuccess(response.data.message)
        }
      } catch (error) {
        // server vrati 403 ak je kanal sukromny alebo ma pouzivatel ban
        const message = error.response?.data?.message || 'Nepodarilo sa pripojiť do kanála'
        notifyError(message)
      }
    },

    // zrusenie kanala spravcom cez /quit
    async quitChannel(channelName = null) {
      const targetName = channelName || this.activeChannelName
      const channel = this.channels.find((c) => c.name === targetName)

      if (!channel) return

      // kontrola ci je pouzivatel spravca
      if (channel.createdBy !== this.currentUser) {
        notifyError('Iba spravca kanala moze zrusit kanal!')
        return
      }

      try {
        // server zmaze kanal pre vsetkych clenov
        const response = await api.delete(`/channels/${channel.id}`)

        // odstranenie sprav kanala
        delete this.messages[targetName]

        // nacitame kanaly zo servera (ak bol kanal otvoreny, prepne sa na iny)
        await this.fetchChannels()

        // popup sprava Kanal zanikol
        Dialog.create({
          title: 'Kanal zanikol',
          message: response.data.message,
          color: 'negative',
        })
      } catch (error) {
        notifyError(error.response?.data?.message || 'Nepodarilo sa zrušiť kanál')
        // kanal uz mohol zrusit niekto iny, preto obnovime zoznam
        await this.fetchChannels()
      }
    },

    // opustenie členstva cez /cancel alebo tlacidlo
    async cancelChannel(channelName = null) {
      const targetName = channelName || this.activeChannelName
      const channel = this.channels.find((c) => c.name === targetName)

      if (!channel) return

      try {
        // ak je pouzivatel spravca kanala, server kanal zmaze pre vsetkych
        const response = await api.post(`/channels/${channel.id}/leave`)

        if (response.data.channelDeleted) {
          delete this.messages[targetName]
        }

        // nacitame kanaly zo servera (ak bol kanal otvoreny, prepne sa na iny)
        await this.fetchChannels()

        Dialog.create({
          title: response.data.channelDeleted ? 'Kanal zanikol' : 'Opustil si kanal',
          message: response.data.message,
          color: response.data.channelDeleted ? 'negative' : 'warning',
        })
      } catch (error) {
        notifyError(error.response?.data?.message || 'Nepodarilo sa opustiť kanál')
        // kanal uz mohol zrusit niekto iny, preto obnovime zoznam
        await this.fetchChannels()
      }
    },

    // odoslanie spravy do aktualneho kanala - sprava sa ulozi na serveri
    async sendMessage(text) {
      // ak nie je vybrany ziadny kanal (kde je pouzivatel clenom) alebo je text prazdny, nic nespravime
      if (!this.activeChannel || !text || !text.trim()) return

      // v offline stave sa spravy neodosielaju
      if (this.currentUserStatus === 'Offline') {
        notifyWarning('Ste offline, správu nie je možné odoslať')
        return
      }

      // kanal si zapamatame, keby ho pouzivatel pocas odosielania prepol
      const channelName = this.activeChannelName

      try {
        // server spravu ulozi, najde v nej @nickname a vrati ju spat
        const response = await api.post(`/channels/${this.activeChannel.id}/messages`, {
          content: text.trim(),
        })

        // ak nahodou pre dany kanal este neexistuje pole sprav, vytvorime ho
        if (!this.messages[channelName]) {
          this.messages[channelName] = []
        }

        // ulozenu spravu pridame na koniec zoznamu sprav kanala
        this.messages[channelName].push(this.convertServerMessage(response.data))
      } catch (error) {
        notifyError(error.response?.data?.message || 'Správu sa nepodarilo odoslať')
      }
    },

    // vyhodenie pouzivatela z verejneho kanala cez /kick
    async kickUser(nickName) {
      if (!this.activeChannel || !nickName) return

      try {
        const response = await api.post(`/channels/${this.activeChannel.id}/kick`, {
          nickname: nickName,
        })

        // nacitame aktualnych clenov, zabanovanych a hlasy
        await this.fetchChannels()

        if (response.data.banned) {
          notifySuccess(response.data.message)
        } else {
          notifyInfo(response.data.message)
        }
      } catch (error) {
        notifyError(error.response?.data?.message || 'Nepodarilo sa vyhodiť používateľa')
        // zoznam clenov mohol byt neaktualny, preto ho obnovime
        await this.fetchChannels()
      }
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
