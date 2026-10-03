<template>
  <!-- hlavna stranka s chatovacim oknom -->
  <q-page class="column justify-between bg-dust-grey">
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
      <!-- horna lista aktualne vybraneho kanala -->
      <div class="q-pa-md bg-dry-sage text-pine-teal row items-center justify-between shadow-1">
        <div>
          <span class="text-h6 text-weight-bold"># {{ chatStore.activeChannelName }}</span>
          <!-- popis kanala zobrazeny vedla nazvu -->
          <span v-if="chatStore.activeChannel?.description" class="text-caption q-ml-sm">
            {{ chatStore.activeChannel.description }}
          </span>
        </div>

        <!-- pomocne tlacidla pre kanal -->
        <div class="row items-center q-gutter-xs">
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
      <div ref="messagesContainer" class="col q-pa-md overflow-auto">
        <!-- oznam ak v kanali este nie su ziadne spravy -->
        <div v-if="chatStore.activeMessages.length === 0" class="text-center text-grey-7 q-pa-xl">
          <q-icon name="chat_bubble_outline" size="48px" class="q-mb-sm text-grey-5" />
          <div class="text-subtitle1 text-weight-medium">
            Zatiaľ žiadne správy v kanáli #{{ chatStore.activeChannelName }}
          </div>
        </div>

        <!-- dynamicky zoznam sprav z aktualneho kanala -->
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
      </div>
    </template>

    <!-- spodny fixny prikazovy riadok -->
    <div class="q-pa-md bg-pine-teal">
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
import { Dialog } from 'quasar'
import { notifyWarning } from '@/utils/helper_functions'

// nacitanie storu pre chat
const chatStore = useChatStore()

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

// funkcia zisti ci je v sprave od ineho pouzivatela spomenuty aktualne prihlaseny pouzivatel so zavinacom
function isMentioned(msg) {
  if (msg.user === chatStore.currentUser) return false
  return msg.text.includes(`@${chatStore.currentUser}`)
}

// funkcia na posun chatu uplne na spodok pri novej sprave
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// ked pribudne nova sprava (napr. od ineho pouzivatela), posunieme chat na spodok
watch(
  () => chatStore.activeMessages.length,
  () => {
    scrollToBottom()
  },
)

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
