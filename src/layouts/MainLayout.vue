<template>
  <!-- hlavny layout celej aplikacie -->
  <q-layout view="hHh lpR fFf" class="bg-dust-grey">
    <!-- horna lista -->
    <q-header elevated class="bg-pine-teal text-dust-grey">
      <q-toolbar>
        <!-- tlacidlo na otvorenie laveho menu s kanalmi -->
        <q-btn flat round dense icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <!-- nazov aplikacie -->
        <q-toolbar-title class="text-weight-bold">{{ APP_NAME }}</q-toolbar-title>

        <!-- profil prihlaseneho pouzivatela na pravej strane hornej listy -->
        <div class="row items-center q-gutter-sm">
          <!-- tlacidlo na zmenu stavu s farebnou bodkou a nazvom -->
          <q-btn flat no-caps dense class="rounded-borders q-px-sm bg-hunter-green">
            <!-- farebna bodka reprezentujuca aktualny stav pouzivatela -->
            <q-badge rounded :color="statusColors[chatStore.currentUserStatus]" class="q-mr-xs" />
            <!-- nazov aktualneho stavu pouzivatela -->
            <span class="text-caption text-weight-medium">{{ chatStore.currentUserStatus }}</span>
            <!-- sipka znazornujuca moznost rozkliknutia -->
            <q-icon name="expand_more" size="xs" class="q-ml-xs text-dry-sage" />

            <!-- vyskakovacie menu pre zmenu stavu -->
            <q-menu auto-close class="bg-pine-teal text-dust-grey shadow-4 rounded-borders">
              <q-list dense style="min-width: 150px" class="q-pa-xs">
                <q-item
                  v-for="st in statuses"
                  :key="st.label"
                  clickable
                  v-ripple
                  class="rounded-borders"
                  :active="chatStore.currentUserStatus === st.label"
                  active-class="bg-hunter-green text-dust-grey"
                  @click="chatStore.setStatus(st.label)"
                >
                  <q-item-section avatar style="min-width: 28px">
                    <q-badge rounded :color="st.color" />
                  </q-item-section>
                  <q-item-section>{{ st.label }}</q-item-section>
                  <!-- znacka fajky pri stave -->
                  <q-item-section v-if="chatStore.currentUserStatus === st.label" side>
                    <q-icon name="check" size="xs" color="dry-sage" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <!-- ikona profilu pouzivatela -->
          <q-btn flat dense round>
            <q-icon name="account_circle" size="34px" />
            <q-tooltip>Profil pouzivatela</q-tooltip>
          </q-btn>

          <!-- blok s menom prihlaseneho pouzivatela -->
          <div class="column justify-center text-left leading-tight q-mr-xs">
            <span class="text-weight-bold text-caption">{{ chatStore.currentUserName }}</span>
            <span class="text-caption text-dry-sage" style="font-size: 11px"
              >@{{ chatStore.currentUser }}</span
            >
          </div>

          <!-- tlacidlo na odhlasenie -->
          <q-btn flat dense round icon="logout" @click="handleLogout" size="md">
            <q-tooltip>Odhlásiť sa</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- lavy bocny panel so zoznamom kanalov -->
    <q-drawer v-model="leftDrawerOpen" side="left" bordered class="bg-hunter-green text-dust-grey">
      <div class="q-pa-sm">
        <div class="row items-center justify-between q-px-sm q-py-xs">
          <span class="text-caption text-dry-sage text-weight-bold">KANALY</span>
          <!-- tlacidlo na vytvorenie kanala cez dialog -->
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="add"
            class="text-dry-sage"
            @click="openCreateDialog"
          >
            <q-tooltip>Vytvoriť kanál</q-tooltip>
          </q-btn>
        </div>

        <!-- zoznam kanalov, v ktorych je pouzivatel clenom -->
        <q-list dense>
          <q-item
            v-for="ch in chatStore.myChannels"
            :key="ch.name"
            clickable
            v-ripple
            :active="ch.name === chatStore.activeChannelName"
            active-class="bg-fern text-dust-grey"
            @click="chatStore.selectChannel(ch.name)"
          >
            <q-item-section avatar>
              <q-icon :name="ch.isPrivate ? 'lock' : 'tag'" />
            </q-item-section>
            <q-item-section>{{ ch.name }}</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <!-- pravy bocny panel so zoznamom clenov v kanali -->
    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      bordered
      class="bg-hunter-green text-dust-grey"
    >
      <div class="q-pa-md bg-pine-teal text-weight-bold">
        Clenovia kanala (#{{ chatStore.activeChannelName }})
      </div>
      <q-separator color="fern" />

      <!-- zoznam clenov zo storu -->
      <q-list dense class="q-pa-sm">
        <q-item
          v-for="m in chatStore.activeChannel?.members || []"
          :key="m.name"
          clickable
          v-ripple
        >
          <!-- farebna bodka so stavom clena (Online, DND, Offline) -->
          <q-item-section avatar style="min-width: 24px">
            <q-badge rounded :color="statusColors[getUserStatus(m.name, chatStore.users)]" />
            <q-tooltip>{{ getUserStatus(m.name, chatStore.users) }}</q-tooltip>
          </q-item-section>
          <q-item-section>
            <div class="row items-center justify-between">
              <span>{{ m.name }}</span>
              <!-- stitok Admin ak je pouzivatel spravcom -->
              <q-badge
                v-if="m.role === 'admin'"
                color="fern"
                text-color="dust-grey"
                class="q-ml-xs"
              >
                Admin
              </q-badge>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- hlavny obsah stranky kde sa nacitava chat -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- dialog na vytvorenie noveho kanala -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 320px" class="bg-dust-grey">
        <!-- nadpis dialogu -->
        <q-card-section class="bg-pine-teal text-dust-grey">
          <div class="text-h6">Vytvoriť kanál</div>
        </q-card-section>

        <q-card-section>
          <!-- pole pre nazov kanala -->
          <q-input
            v-model="newChannelName"
            label="Názov kanála"
            dense
            outlined
            bg-color="white"
            autofocus
            @keyup.enter="createChannel"
          />

          <!-- vyber typu kanala -->
          <div class="text-caption text-weight-bold text-pine-teal q-mt-md">Typ kanála</div>
          <q-option-group
            v-model="newChannelType"
            :options="channelTypeOptions"
            color="fern"
            inline
          />
        </q-card-section>

        <!-- tlacidla dialogu -->
        <q-card-actions align="right">
          <q-btn flat label="Zrušiť" class="text-pine-teal" v-close-popup />
          <q-btn unelevated label="Vytvoriť" color="fern" @click="createChannel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { APP_NAME } from '@/config/app'
import { useChatStore } from '@/stores/chatStore'
import { getUserStatus } from '@/utils/helper_functions'

const router = useRouter()

// nacitanie storu pre chat
const chatStore = useChatStore()

// funkcia na odhlasenie pouzivatela
function handleLogout() {
  chatStore.logout()
  router.push('/login')
}

const leftDrawerOpen = ref(true)
const rightDrawerOpen = ref(false)

// poskytnutie funkcie pre potomkov na prepnutie praveho panela
provide('toggleRightDrawer', () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
})

// farby bodiek pre jednotlive stavy pouzivatela
const statusColors = { Online: 'fern', DND: 'negative', Offline: 'grey-6' }
const statuses = [
  { label: 'Online', color: 'fern' },
  { label: 'DND', color: 'negative' },
  { label: 'Offline', color: 'grey-6' },
]

// --- dialog na vytvorenie kanala ---

// ci je dialog otvoreny
const showCreateDialog = ref(false)
// nazov noveho kanala z dialogu
const newChannelName = ref('')
// typ noveho kanala: 'public' alebo 'private'
const newChannelType = ref('public')
// moznosti pre vyber typu kanala
const channelTypeOptions = [
  { label: 'Verejný', value: 'public' },
  { label: 'Súkromný', value: 'private' },
]

// otvorenie dialogu po kliknuti na '+' (polia sa vycistia)
function openCreateDialog() {
  newChannelName.value = ''
  newChannelType.value = 'public'
  showCreateDialog.value = true
}

// vytvorenie kanala podla udajov z dialogu
function createChannel() {
  if (!newChannelName.value.trim()) return

  const isPrivate = newChannelType.value === 'private'
  chatStore.joinChannel(newChannelName.value.trim(), isPrivate)

  showCreateDialog.value = false
}

// --- simulacia prichadzajucich sprav ---

// ukazkove texty, ktore "posielaju" ostatni pouzivatelia
const fakeTexts = [
  'Ahoj, ako sa mate?',
  'Kto ide dnes na cvicenie?',
  'Pozrel som si to, vyzera to dobre.',
  'Mam otazku k zadaniu.',
  'Diky za info!',
]

// odkaz na casovac, aby sme ho vedeli pri odchode zastavit
let simulationTimer = null

// funkcia vyberie nahodny kanal a nahodneho clena, ktory don posle spravu
function simulateIncomingMessage() {
  if (chatStore.myChannels.length === 0) return

  // nahodny kanal z kanalov pouzivatela
  const channelIndex = Math.floor(Math.random() * chatStore.myChannels.length)
  const channel = chatStore.myChannels[channelIndex]

  // mozni odosielatelia: clenovia kanala okrem mna, ktori nie su offline
  const senders = []
  for (const member of channel.members) {
    const status = getUserStatus(member.name, chatStore.users)
    if (member.name !== chatStore.currentUser && status !== 'Offline') {
      senders.push(member.name)
    }
  }
  if (senders.length === 0) return

  // nahodny odosielatel a nahodny text
  const sender = senders[Math.floor(Math.random() * senders.length)]
  const text = fakeTexts[Math.floor(Math.random() * fakeTexts.length)]

  chatStore.receiveMessage(channel.name, sender, text)
}

// po nacitani layoutu spustime simulaciu kazdych 20 sekund
onMounted(() => {
  simulationTimer = setInterval(simulateIncomingMessage, 20000)
})

// pri odchode z layoutu (napr. odhlasenie) casovac zastavime
onUnmounted(() => {
  clearInterval(simulationTimer)
})
</script>
