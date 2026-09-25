<template>
  <!-- hlavna stranka s chatovacim oknom -->
  <q-page class="column justify-between bg-dust-grey">
    <!-- ak pouzivatel nie je v ziadnom kanali, zobrazime prazdny stav -->
    <div
      v-if="!chatStore.activeChannelName || chatStore.channels.length === 0"
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
          <q-btn flat dense round icon="person_add" class="text-pine-teal">
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
      <div class="col q-pa-md overflow-auto">
        <!-- ukazkova sprava 1 -->
        <div class="q-mb-md q-pa-sm bg-white rounded-borders shadow-1" style="max-width: 70%">
          <div class="text-weight-bold text-hunter-green">
            ed <span class="text-caption text-grey">12:30</span>
          </div>
          <div class="text-dark">
            Ahoj vsetci, toto je ukazkova sprava v kanali #{{ chatStore.activeChannelName }}.
          </div>
        </div>

        <!-- ukazkova sprava 2 -->
        <div class="q-mb-md q-pa-sm bg-white rounded-borders shadow-1" style="max-width: 70%">
          <div class="text-weight-bold text-hunter-green">
            peter <span class="text-caption text-grey">12:32</span>
          </div>
          <div class="text-dark">
            Pozdravujem
            <span class="bg-hunter-green text-dust-grey q-px-xs rounded-borders text-weight-bold">
              @moj_nick </span
            >, pozri si novy dizajn!
          </div>
        </div>

        <!-- ukazkova sprava 3 -->
        <div
          class="q-mb-md q-pa-sm bg-fern text-white rounded-borders shadow-1 q-ml-auto"
          style="max-width: 70%"
        >
          <div class="text-weight-bold text-dust-grey">
            @moj_nick <span class="text-caption text-dust-grey">12:35</span>
          </div>
          <div>Super, vyzera to fajn a cisto.</div>
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
          placeholder="Napis spravu alebo prikaz (napr. /join nazov [private], /quit, /cancel, /list)..."
          class="col"
          @keyup.enter="handleSend"
        />

        <!-- tlacidlo na odoslanie -->
        <q-btn round color="fern" icon="send" text-color="dust-grey" @click="handleSend" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { Notify } from 'quasar'

// nacitanie storu pre chat
const chatStore = useChatStore()

// funkcia na prepnutie praveho panelu zo zoznamom clenov z layoutu
const toggleRightDrawer = inject('toggleRightDrawer', () => {})

// text v prikazovom riadku
const messageText = ref('')

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
    } else if (command === '/quit') {
      // prikaz: /quit
      chatStore.quitChannel()
    } else if (command === '/cancel') {
      // prikaz: /cancel
      chatStore.cancelChannel()
    } else if (command === '/list') {
      // prikaz: /list
      toggleRightDrawer()
    } else {
      Notify.create({
        type: 'warning',
        message: `Neznamy prikaz: ${command}. Podporovane: /join, /quit, /cancel, /list`,
      })
    }
  }
  // vycistenie vstupneho pola
  messageText.value = ''
}
</script>
