<template>
  <!-- hlavny layout celej aplikacie -->
  <q-layout view="hHh lpR fFf" class="bg-dust-grey">
    <!-- horna lista -->
    <q-header elevated class="bg-pine-teal text-dust-grey">
      <q-toolbar>
        <!-- tlacidlo na otvorenie laveho menu s kanalmi -->
        <q-btn flat round dense icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <!-- nazov aplikacie (na mobile skryty) -->
        <q-toolbar-title class="text-weight-bold gt-xs">{{ APP_NAME }}</q-toolbar-title>
        <q-space class="lt-sm" />

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

          <!-- ikona profilu pouzivatela a nastavenia -->
          <q-btn flat dense round>
            <q-icon name="account_circle" size="34px" />
            <q-tooltip>Profil a nastavenia</q-tooltip>

            <!-- menu s nastaveniami pouzivatela -->
            <q-menu class="bg-pine-teal text-dust-grey shadow-4 rounded-borders q-pa-xs">
              <q-list dense style="min-width: 250px">
                <q-item-label header class="text-dry-sage text-weight-bold" style="font-size: 11px">
                  NASTAVENIA UPOZORNENÍ
                </q-item-label>
                <q-item tag="label" v-ripple class="rounded-borders">
                  <q-item-section>
                    <q-item-label class="text-caption text-weight-medium">
                      Notifikovať iba spomenutia (@{{ chatStore.currentUser }})
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <!-- hodnota sa cita z prihlaseneho pouzivatela a pri zmene sa ulozi cez setOnlyMentions -->
                    <q-toggle
                      :model-value="chatStore.currentUserOnlyMentions"
                      @update:model-value="chatStore.setOnlyMentions"
                      color="fern"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <!-- blok s menom prihlaseneho pouzivatela -->
          <div class="column justify-center text-left leading-tight q-mr-xs">
            <span class="text-weight-bold text-caption">{{ chatStore.currentUserName }}</span>
            <span class="text-caption text-dry-sage" style="font-size: 11px"
              >@{{ chatStore.currentUser }}</span
            >
          </div>

          <!-- tlacidlo s ikonou zvonceka pre zmeskane notifikacie -->
          <q-btn flat dense round icon="notifications" size="md" class="text-dust-grey">
            <q-badge
              v-if="chatStore.unreadNotificationsCount > 0"
              color="negative"
              floating
              rounded
            >
              {{ chatStore.unreadNotificationsCount }}
            </q-badge>
            <q-tooltip>Zmeškané upozornenia</q-tooltip>

            <!-- vyskakovacie okno so zmeskanymi upozorneniami -->
            <q-menu
              @before-show="chatStore.markNotificationsAsRead()"
              class="bg-pine-teal text-dust-grey shadow-4 rounded-borders"
              style="min-width: 290px; max-width: 360px"
            >
              <div class="row items-center justify-between q-pa-sm bg-hunter-green">
                <span class="text-weight-bold text-caption">ZMEŠKANÉ UPOZORNENIA</span>
                <q-btn
                  v-if="chatStore.missedNotifications.length > 0"
                  flat
                  dense
                  no-caps
                  size="xs"
                  label="Vymazať všetko"
                  class="text-dry-sage"
                  @click="chatStore.clearMissedNotifications()"
                />
              </div>
              <q-separator color="fern" />

              <!-- oznam ak nie su ziadne zmeskane notifikacie -->
              <div
                v-if="chatStore.missedNotifications.length === 0"
                class="q-pa-md text-center text-caption text-dry-sage"
              >
                Žiadne nové upozornenia
              </div>

              <!-- zoznam zmeskanych notifikacii -->
              <q-list v-else dense class="q-py-xs" style="max-height: 300px; overflow-y: auto">
                <q-item
                  v-for="item in chatStore.missedNotifications"
                  :key="item.id"
                  class="q-my-xs rounded-borders"
                >
                  <q-item-section avatar style="min-width: 28px">
                    <q-icon name="chat" size="xs" color="dry-sage" />
                  </q-item-section>
                  <q-item-section>
                    <div class="row items-center justify-between text-caption text-weight-bold">
                      <span>{{ item.sender }} v #{{ item.channelName }}</span>
                      <span class="text-dry-sage" style="font-size: 10px">{{ item.time }}</span>
                    </div>
                    <div class="text-caption text-grey-4 ellipsis" style="max-width: 200px">
                      {{ item.text }}
                    </div>
                  </q-item-section>
                  <q-item-section side>
                    <!-- tlacidlo na zmazanie jednotliveho upozornenia -->
                    <q-btn
                      flat
                      dense
                      round
                      icon="close"
                      size="xs"
                      color="dry-sage"
                      @click.stop="chatStore.removeMissedNotification(item.id)"
                    >
                      <q-tooltip>Zmazať</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <!-- tlacidlo na odhlasenie -->
          <q-btn flat dense round icon="logout" @click="handleLogout" size="md">
            <q-tooltip>Odhlásiť sa</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- lavy bocny panel so zoznamom kanalov -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      bordered
      :width="$q.screen.lt.sm ? 190 : 300"
      :style="$q.screen.lt.sm ? 'top: 50px; height: calc(100% - 50px)' : ''"
      class="bg-hunter-green text-dust-grey"
    >
      <div :class="$q.screen.lt.sm ? 'q-pa-xs' : 'q-pa-sm'">
        <div
          class="row items-center justify-between"
          :class="$q.screen.lt.sm ? 'q-px-xs q-py-xs' : 'q-px-sm q-py-xs'"
        >
          <span
            class="text-caption text-dry-sage text-weight-bold"
            :style="$q.screen.lt.sm ? 'font-size: 11px' : ''"
            >KANÁLY</span
          >
          <!-- tlacidlo na vytvorenie kanala cez dialog -->
          <q-btn
            flat
            dense
            round
            :size="$q.screen.lt.sm ? 'xs' : 'sm'"
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
            :class="$q.screen.lt.sm ? 'q-px-xs q-py-none' : ''"
            :style="$q.screen.lt.sm ? 'min-height: 32px' : ''"
            @click="chatStore.selectChannel(ch.name)"
          >
            <q-item-section
              avatar
              :style="$q.screen.lt.sm ? 'min-width: 22px; padding-right: 6px' : ''"
            >
              <q-icon :name="ch.isPrivate ? 'lock' : 'tag'" :size="$q.screen.lt.sm ? 'xs' : 'sm'" />
            </q-item-section>
            <q-item-section :class="{ ellipsis: $q.screen.lt.sm }">
              <div class="row items-center justify-between" :class="{ 'no-wrap': $q.screen.lt.sm }">
                <span
                  :class="[
                    $q.screen.lt.sm ? 'ellipsis text-caption' : '',
                    { 'text-weight-bold text-white': chatStore.isChannelHighlighted(ch.name) },
                  ]"
                >
                  {{ ch.name }}
                </span>
                <!-- mala znacka ak je kanal zvyrazneny po pozvani -->
                <q-badge
                  v-if="chatStore.isChannelHighlighted(ch.name)"
                  :label="$q.screen.lt.sm ? 'Nový' : 'Pozvánka'"
                  class="bg-dry-sage text-pine-teal q-ml-xs text-weight-bold"
                  :style="$q.screen.lt.sm ? 'font-size: 9px; padding: 1px 3px' : ''"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <!-- pravy bocny panel so zoznamom clenov v kanali -->
    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      bordered
      :width="$q.screen.lt.sm ? 190 : 300"
      :style="$q.screen.lt.sm ? 'top: 50px; height: calc(100% - 50px)' : ''"
      class="bg-hunter-green text-dust-grey"
    >
      <div
        class="bg-pine-teal text-weight-bold"
        :class="$q.screen.lt.sm ? 'q-pa-xs text-caption' : 'q-pa-md'"
      >
        {{
          $q.screen.lt.sm
            ? `Členovia (#${chatStore.activeChannelName})`
            : `Clenovia kanala (#${chatStore.activeChannelName})`
        }}
      </div>
      <q-separator color="fern" />

      <!-- zoznam clenov zo storu -->
      <q-list dense :class="$q.screen.lt.sm ? 'q-pa-xs' : 'q-pa-sm'">
        <q-item
          v-for="m in chatStore.activeChannel?.members || []"
          :key="m.name"
          clickable
          v-ripple
          :class="$q.screen.lt.sm ? 'q-px-xs q-py-none' : ''"
          :style="$q.screen.lt.sm ? 'min-height: 30px' : ''"
        >
          <!-- farebna bodka so stavom clena (Online, DND, Offline) -->
          <q-item-section
            avatar
            :style="$q.screen.lt.sm ? 'min-width: 18px; padding-right: 4px' : 'min-width: 24px'"
          >
            <q-badge rounded :color="statusColors[getUserStatus(m.name, chatStore.users)]" />
            <q-tooltip>{{ getUserStatus(m.name, chatStore.users) }}</q-tooltip>
          </q-item-section>
          <q-item-section :class="{ ellipsis: $q.screen.lt.sm }">
            <div class="row items-center justify-between" :class="{ 'no-wrap': $q.screen.lt.sm }">
              <span :class="$q.screen.lt.sm ? 'ellipsis text-caption' : ''">{{ m.name }}</span>
              <!-- stitok Admin ak je pouzivatel spravcom -->
              <q-badge
                v-if="m.role === 'admin'"
                color="fern"
                text-color="dust-grey"
                class="q-ml-xs"
                :style="$q.screen.lt.sm ? 'font-size: 9px; padding: 1px 3px' : ''"
              >
                Admin
              </q-badge>
              <!-- pocet hlasov za vyhodenie clena (zobrazi sa iba ak nejake ma) -->
              <q-badge
                v-if="getKickVotes(m.name) > 0"
                color="negative"
                text-color="white"
                class="q-ml-xs"
                :style="$q.screen.lt.sm ? 'font-size: 9px; padding: 1px 3px' : ''"
              >
                {{
                  $q.screen.lt.sm ? `${getKickVotes(m.name)}/3` : `Kick ${getKickVotes(m.name)}/3`
                }}
              </q-badge>
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- zoznam pouzivatelov s trvalym banom -->
      <template v-if="chatStore.activeChannel && chatStore.activeChannel.bannedUsers.length > 0">
        <div
          class="text-caption text-dry-sage text-weight-bold"
          :class="$q.screen.lt.sm ? 'q-px-sm q-pt-sm' : 'q-px-md q-pt-md'"
          :style="$q.screen.lt.sm ? 'font-size: 11px' : ''"
        >
          ZABANOVANÍ
        </div>
        <q-list dense :class="$q.screen.lt.sm ? 'q-pa-xs' : 'q-pa-sm'">
          <q-item
            v-for="nick in chatStore.activeChannel.bannedUsers"
            :key="nick"
            :class="$q.screen.lt.sm ? 'q-px-xs' : ''"
            :style="$q.screen.lt.sm ? 'min-height: 28px' : ''"
          >
            <q-item-section
              avatar
              :style="$q.screen.lt.sm ? 'min-width: 18px; padding-right: 4px' : 'min-width: 24px'"
            >
              <q-icon name="block" size="xs" color="negative" />
            </q-item-section>
            <q-item-section
              class="text-grey-5"
              :class="$q.screen.lt.sm ? 'ellipsis text-caption' : ''"
              >{{ nick }}</q-item-section
            >
          </q-item>
        </q-list>
      </template>
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
import { ref, provide, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { AppVisibility } from 'quasar'
import { APP_NAME } from '@/config/app'
import { useChatStore } from '@/stores/chatStore'
import { getUserStatus, notifyInfo } from '@/utils/helper_functions'

const router = useRouter()

// nacitanie storu pre chat
const chatStore = useChatStore()

// funkcia na odhlasenie pouzivatela
function handleLogout() {
  chatStore.logout()
  router.push('/login')
}

// sledovanie navratu pouzivatela do aplikacie cez AppVisibility
watch(
  () => AppVisibility.appVisible,
  (isVisible) => {
    // ak sa pouzivatel vratil do aplikacie a ma neprecitane zmeskane notifikacie
    if (isVisible && chatStore.unreadNotificationsCount > 0) {
      const count = chatStore.unreadNotificationsCount
      const text =
        count === 1
          ? 'Máte 1 nové zmeškané upozornenie'
          : `Máte ${count} nových zmeškaných upozornení`
      notifyInfo(text)
    }
  },
)

const leftDrawerOpen = ref(false)
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

// funkcia vrati pocet hlasov za vyhodenie daneho clena v aktualnom kanali
function getKickVotes(nick) {
  if (!chatStore.activeChannel) return 0
  const votes = chatStore.activeChannel.kickVotes[nick]
  if (!votes) return 0
  return votes.length
}

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

  // cca kazda tretia sprava spomenie prihlaseneho pouzivatela
  let fullText = text
  if (Math.random() < 0.33) {
    fullText = `@${chatStore.currentUser} ${text}`
  }

  // nastavime ze pouzivatel zacal pisat spravu a simulujeme postupne prirastanie textu
  let currentLength = 0
  const stepInterval = Math.max(50, Math.floor(4000 / fullText.length))

  const typingProgressTimer = setInterval(() => {
    currentLength += Math.floor(Math.random() * 2) + 1
    if (currentLength >= fullText.length) {
      currentLength = fullText.length
      clearInterval(typingProgressTimer)
    }
    const partialText = fullText.slice(0, currentLength)
    chatStore.setTyping(channel.name, sender, true, partialText)
  }, stepInterval)

  // po 5 sekundach spravu realne posleme (indikator zhasne)
  setTimeout(() => {
    clearInterval(typingProgressTimer)
    chatStore.receiveMessage(channel.name, sender, fullText)
  }, 5000)
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
