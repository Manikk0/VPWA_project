<template>
  <!-- hlavna stranka s chatovacim oknom (fixna vyska aby sa scroloval iba stred) -->
  <q-page
    class="column justify-between bg-dust-grey"
    style="height: calc(100vh - 50px); max-height: calc(100vh - 50px); overflow: hidden"
  >
    <!-- ak pouzivatel nema vybrany ziadny svoj kanal, zobrazime prazdny stav -->
    <div
      v-if="!chatStore.activeChannel"
      class="col flex flex-center text-center q-pa-md text-pine-teal"
    >
      <div>
        <q-icon name="chat" size="64px" class="q-mb-md text-dry-sage" />
        <div class="text-h6 text-weight-bold">Nie ste v ziadnom kanali</div>
        <div class="text-subtitle2 text-grey-8">
          Vytvorte novy kanal pomocou tlacidla + vlavo alebo prikazom /join
        </div>
      </div>
    </div>

    <!-- ak je vybrany kanal, zobrazime obsah chatu -->
    <template v-else>
      <!-- horna lista aktualne vybraneho kanala (fixna na vrchu) -->
      <div
        class="q-pa-md bg-dry-sage text-pine-teal row no-wrap items-center justify-between shadow-1"
      >
        <!-- col + ellipsis: nazov zaberie zvysne miesto a dlhy text sa skrati trojbodkou -->
        <div class="col ellipsis">
          <!-- nazov kanala (na mobile sa da kliknut a zobrazi sa popup s popisom) -->
          <span
            class="text-h6 text-weight-bold"
            :class="{ 'cursor-pointer': $q.screen.xs }"
            @click="showChannelInfo"
          >
            # {{ chatStore.activeChannelName }}
          </span>
          <!-- popis kanala vedla nazvu (na mobile sa skryje) -->
          <span v-if="chatStore.activeChannel?.description" class="text-caption q-ml-sm gt-xs">
            {{ chatStore.activeChannel.description }}
          </span>
        </div>

        <!-- pomocne tlacidla pre kanal -->
        <div class="row no-wrap items-center q-gutter-xs">
          <!-- tlacidlo na otvorenie praveho menu so zoznamom clenov -->
          <q-btn flat dense round icon="people" class="text-pine-teal" @click="toggleRightDrawer">
            <q-tooltip>Clenovia kanala</q-tooltip>
          </q-btn>

          <!-- tlacidlo na pozvanie noveho clena do kanala -->
          <q-btn
            flat
            dense
            round
            icon="person_add"
            class="text-pine-teal"
            @click="promptInviteUser"
          >
            <q-tooltip>Pozvat clena</q-tooltip>
          </q-btn>

          <!-- tlacidlo na opustenie kanala -->
          <q-btn
            flat
            dense
            round
            icon="exit_to_app"
            class="text-pine-teal"
            @click="chatStore.cancelChannel()"
          >
            <q-tooltip>Opustit kanal</q-tooltip>
          </q-btn>

          <!-- tlacidlo na zrusenie kanala spravcom -->
          <q-btn
            v-if="chatStore.isCurrentAdmin"
            flat
            dense
            round
            icon="delete"
            class="text-pine-teal"
            @click="chatStore.quitChannel()"
          >
            <q-tooltip>Zrusit kanal</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- priestor pre zoznam sprav -->
      <div
        ref="messagesContainer"
        class="col q-pa-md overflow-auto"
        @scroll="handleContainerScroll"
      >
        <!-- oznam ak v kanali este nie su ziadne spravy -->
        <div v-if="chatStore.activeMessages.length === 0" class="text-center text-grey-7 q-pa-xl">
          <q-icon name="chat_bubble_outline" size="48px" class="q-mb-sm text-grey-5" />
          <div class="text-subtitle1 text-weight-medium">
            Zatiaľ žiadne správy v kanáli #{{ chatStore.activeChannelName }}
          </div>
        </div>

        <!-- nekonecne scrolovanie pre nacitavanie staršich sprav smerom nahor -->
        <q-infinite-scroll
          v-else
          :key="chatStore.activeChannelName"
          reverse
          :disable="!userScrolledUp"
          @load="onLoadOlderMessages"
          :offset="100"
        >
          <!-- nacitavaci spiner pri scrollovani nahor -->
          <template #loading>
            <div class="row justify-center q-my-sm">
              <q-spinner-dots color="pine-teal" size="30px" />
            </div>
          </template>

          <!-- zoznam sprav z aktualneho kanala -->
          <div
            v-for="(msg, index) in chatStore.activeMessages"
            :key="index"
            class="q-mb-md q-pa-sm rounded-borders shadow-1"
            :class="[
              msg.user === chatStore.currentUser ? 'bg-fern text-white q-ml-auto' : 'bg-white',
              isMentioned(msg) ? 'mentioned-message' : '',
            ]"
            style="max-width: 70%; width: fit-content; min-width: 140px"
          >
            <!-- meno odosielatela a cas spravy -->
            <div
              class="text-weight-bold row items-center justify-between q-gutter-xs"
              :class="msg.user === chatStore.currentUser ? 'text-dust-grey' : 'text-hunter-green'"
            >
              <span>{{ msg.user }}</span>
              <span
                class="text-caption"
                :class="msg.user === chatStore.currentUser ? 'text-dust-grey' : 'text-grey'"
              >
                {{ msg.time }}
              </span>
            </div>

            <!-- text samotnej spravy so zvyraznenim zavinaca -->
            <div
              class="q-mt-xs"
              :class="msg.user === chatStore.currentUser ? 'text-white' : 'text-dark'"
              style="word-break: break-word"
            >
              <span v-for="(word, wIndex) in msg.text.split(' ')" :key="wIndex">
                <!-- ak slovo zacina @, zvyraznime ho ako stitok -->
                <span
                  v-if="word.startsWith('@')"
                  class="bg-hunter-green text-dust-grey q-px-xs rounded-borders text-weight-bold"
                >
                  {{ word }}
                </span>
                <!-- inak je to bezne slovo v sprave -->
                <span v-else>{{ word }}</span>
                {{ ' ' }}
              </span>
            </div>
          </div>
        </q-infinite-scroll>
      </div>
    </template>

    <!-- spodny fixny prikazovy riadok -->
    <div class="q-pa-md bg-pine-teal">
      <!-- indikator pisucich pouzivatelov -->
      <div
        v-if="chatStore.currentTypingUsers.length > 0"
        class="text-caption text-dust-grey q-mb-xs row items-center q-gutter-xs"
      >
        <q-spinner-dots color="dry-sage" size="18px" />
        <span class="row items-center wrap">
          <template v-for="(nick, nIdx) in chatStore.currentTypingUsers" :key="nick">
            <span
              class="text-weight-bold text-dry-sage cursor-pointer q-mr-xs"
              style="text-decoration: underline"
              @click="showTypingDraft(nick)"
            >
              {{ nick }}
              <q-tooltip>Kliknite pre zobrazenie rozpísanej správy</q-tooltip>
            </span>
            <span v-if="nIdx < chatStore.currentTypingUsers.length - 1" class="q-mr-xs"
              >,&nbsp;</span
            >
          </template>
          <span class="text-weight-medium text-italic">
            {{
              chatStore.currentTypingUsers.length > 1
                ? 'práve píšu správu...'
                : 'práve píše správu...'
            }}
          </span>
        </span>
      </div>

      <div class="row items-center q-gutter-sm">
        <!-- textove pole pre spravu alebo prikaz -->
        <q-input
          v-model="messageText"
          dense
          outlined
          bg-color="white"
          :disable="chatStore.currentUserStatus === 'Offline'"
          :placeholder="
            chatStore.currentUserStatus === 'Offline'
              ? 'Ste offline, správy nie je možné odosielať'
              : 'Napis spravu alebo prikaz (napr. /join nazov, /invite @nick, /kick @nick, /revoke @nick, /quit, /cancel, /list)...'
          "
          class="col"
          @keyup.enter="handleSend"
        />

        <!-- tlacidlo na odoslanie -->
        <q-btn
          round
          color="fern"
          icon="send"
          text-color="dust-grey"
          :disable="chatStore.currentUserStatus === 'Offline'"
          @click="handleSend"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, inject, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { Dialog, useQuasar } from 'quasar'
import { notifyWarning } from '@/utils/helper_functions'

// nacitanie storu pre chat
const chatStore = useChatStore()

// quasar objekt - pouzivame ho na zistenie velkosti obrazovky ($q.screen)
const $q = useQuasar()

// po kliknuti na nazov kanala zobrazi na mobile popup s nazvom a popisom kanala
function showChannelInfo() {
  // na vacsej obrazovke je popis vidno priamo v liste, popup netreba
  if (!$q.screen.xs) return

  let description = chatStore.activeChannel.description
  if (!description) {
    description = 'Kanál nemá popis.'
  }

  Dialog.create({
    title: `# ${chatStore.activeChannelName}`,
    message: description,
    ok: {
      label: 'Zavrieť',
      color: 'fern',
    },
  })
}

// funkcia na prepnutie praveho panelu zo zoznamom clenov z layoutu
const toggleRightDrawer = inject('toggleRightDrawer', () => {})

// odkaz na kontajner so spravami
const messagesContainer = ref(null)

// text v prikazovom riadku
const messageText = ref('')

// funkcia na pozvanie clena cez dialog po kliknuti na tlacidlo
function promptInviteUser() {
  Dialog.create({
    title: 'Pozvať člena',
    message: 'Zadajte nick používateľa:',
    prompt: {
      model: '',
      type: 'text',
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    if (data && data.trim()) {
      chatStore.inviteUser(data.trim())
    }
  })
}

// zobrazi dialog s rozpisanym textom pouzivatela po kliknuti na jeho nick
function showTypingDraft(nick) {
  const draft = chatStore.getTypingDraft(nick)
  Dialog.create({
    title: `Rozpísaná správa od @${nick}`,
    message: draft ? `"${draft}"` : 'Zatiaľ nezadal žiadny text...',
    color: 'pine-teal',
    ok: {
      label: 'Zavrieť',
      color: 'fern',
    },
  })
}

// funkcia zisti ci je v sprave od ineho pouzivatela spomenuty aktualne prihlaseny pouzivatel so zavinacom
function isMentioned(msg) {
  if (msg.user === chatStore.currentUser) return false
  return msg.text.includes(`@${chatStore.currentUser}`)
}

// funkcia na posun chatu uplne nadol
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// priznak ci pouzivatel fyzicky scroloval nahor k vrchu chatu
const userScrolledUp = ref(false)

// funkcia zachytava fyzicke scrolovanie v okne sprav
function handleContainerScroll() {
  if (!messagesContainer.value) return

  const box = messagesContainer.value
  if (box.scrollHeight <= box.clientHeight) return

  // ak sa pouzivatel dostane dostatocne blizko k vrchu (scrollTop < 100), povolime infinite scroll
  if (box.scrollTop < 100) {
    userScrolledUp.value = true
  }
}

// funkcia na nacitanie starsich sprav pri scrollovani nahor
function onLoadOlderMessages(index, done) {
  // ak pouzivatel este fyzicky nescroloval nahor, nevolame nacitavanie
  if (!userScrolledUp.value) {
    done()
    return
  }

  // ak su uz zobrazene vsetky spravy kanala, hned zastavime infinite scroll (bez loadera)
  const visibleCount = chatStore.visibleMessageCounts[chatStore.activeChannelName] || 10
  if (visibleCount >= totalMessagesInChannel()) {
    done(true)
    return
  }

  // simulujeme kratke zdrzanie pre krajsi vizualny efekt nacitavania
  setTimeout(() => {
    const hasMore = chatStore.loadOlderMessages()
    if (!hasMore) {
      // ak uz nie su ziadne dalsie starsie spravy v kanali, zastavime infinite scroll
      done(true)
    } else {
      // nacitali sme dalsiu davku sprav
      done()
    }
  }, 500)
}

// ked sa prepne kanal, posunieme chat na spodok (k najnovsim spravam) a zakazeme infinite scroll kym pouzivatel nescroloval
watch(
  () => chatStore.activeChannelName,
  () => {
    userScrolledUp.value = false
    scrollToBottom()
  },
  { immediate: true },
)

// funkcia vrati pocet vsetkych sprav v aktualnom kanali (nielen zobrazenych)
function totalMessagesInChannel() {
  const channelMessages = chatStore.messages[chatStore.activeChannelName] || []
  return channelMessages.length
}

// ked pribudne nova sprava, posunieme chat na spodok
watch(totalMessagesInChannel, () => {
  scrollToBottom()
})

// funkcia na spracovanie odoslania spravy alebo prikazu
function handleSend() {
  const text = messageText.value.trim()
  if (!text) return

  // ak text zacina lomitkom ide o prikaz
  if (text.startsWith('/')) {
    const parts = text.split(' ')
    const command = parts[0].toLowerCase()

    if (command === '/join') {
      // prikaz: /join nazovKanala [private]
      const channelName = parts[1] || ''
      const isPrivate = parts[2] && parts[2].toLowerCase() === 'private'
      chatStore.joinChannel(channelName, isPrivate)
    } else if (command === '/invite') {
      // prikaz: /invite @user
      const nickParam = parts[1] || ''
      if (!nickParam.startsWith('@')) {
        notifyWarning('V príkaze musíte zadať nickname so zavináčom: /invite @nick')
        messageText.value = ''
        return
      }
      chatStore.inviteUser(nickParam.slice(1))
    } else if (command === '/quit') {
      // prikaz: /quit
      chatStore.quitChannel()
    } else if (command === '/cancel') {
      // prikaz: /cancel
      chatStore.cancelChannel()
    } else if (command === '/kick') {
      // prikaz: /kick @nick
      const nickParam = parts[1] || ''
      if (!nickParam.startsWith('@')) {
        notifyWarning('V príkaze musíte zadať nickname so zavináčom: /kick @nick')
        messageText.value = ''
        return
      }
      chatStore.kickUser(nickParam.slice(1))
    } else if (command === '/revoke') {
      // prikaz: /revoke @nick
      const nickParam = parts[1] || ''
      if (!nickParam.startsWith('@')) {
        notifyWarning('V príkaze musíte zadať nickname so zavináčom: /revoke @nick')
        messageText.value = ''
        return
      }
      chatStore.revokeUser(nickParam.slice(1))
    } else if (command === '/list') {
      // prikaz: /list
      toggleRightDrawer()
    } else {
      notifyWarning(
        `Neznamy prikaz: ${command}. Podporovane: /join, /invite, /kick, /revoke, /quit, /cancel, /list`,
      )
    }
  } else {
    // ak text nezacina lomitkom, je to obycajna sprava
    chatStore.sendMessage(text)
    // posunieme chat na najnovsiu spravu
    scrollToBottom()
  }

  // vycistenie vstupneho pola
  messageText.value = ''
}
</script>
