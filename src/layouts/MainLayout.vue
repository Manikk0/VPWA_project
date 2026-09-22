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
            <q-badge rounded :color="statusColors[userStatus]" class="q-mr-xs" />
            <!-- nazov aktualneho stavu pouzivatela -->
            <span class="text-caption text-weight-medium">{{ userStatus }}</span>
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
                  :active="userStatus === st.label"
                  active-class="bg-hunter-green text-dust-grey"
                  @click="userStatus = st.label"
                >
                  <q-item-section avatar style="min-width: 28px">
                    <q-badge rounded :color="st.color" />
                  </q-item-section>
                  <q-item-section>{{ st.label }}</q-item-section>
                  <!-- značka fajky pri stave -->
                  <q-item-section v-if="userStatus === st.label" side>
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

          <!-- dvojriadkovy blok s menom a prezyvkou pouzivatela -->
          <div class="column justify-center text-left leading-tight q-mr-xs">
            <span class="text-weight-bold text-caption">Meno Pouzivatela</span>
            <span class="text-caption text-dry-sage" style="font-size: 11px">@moj_nick</span>
          </div>

          <!-- tlacidlo na odhlasenie -->
          <q-btn flat dense round icon="logout" to="/login" size="md">
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
          <!-- tlacidlo na pridanie kanala -->
          <q-btn flat dense round size="sm" icon="add" class="text-dry-sage" />
        </div>

        <!-- zoznam kanalov -->
        <q-list dense>
          <q-item
            v-for="ch in channels"
            :key="ch.name"
            clickable
            v-ripple
            :active="ch.active"
            active-class="bg-fern text-dust-grey"
          >
            <q-item-section avatar>
              <q-icon :name="ch.icon" />
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
        Clenovia kanala ({{ members.length }})
      </div>
      <q-separator color="fern" />

      <!-- zoznam clenov -->
      <q-list dense class="q-pa-sm">
        <q-item v-for="m in members" :key="m" clickable v-ripple>
          <q-item-section>{{ m }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- hlavny obsah stranky kde sa nacitava chat -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, provide } from 'vue'
import { APP_NAME } from '@/config/app'

const leftDrawerOpen = ref(true)
const rightDrawerOpen = ref(false)

// poskytnutie funkcie pre potomkov (IndexPage) na prepnutie zoznamu clenov
provide('toggleRightDrawer', () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
})

const userStatus = ref('Online')
const statusColors = { Online: 'fern', DND: 'negative', Offline: 'grey-6' }
const statuses = [
  { label: 'Online', color: 'fern' },
  { label: 'DND', color: 'negative' },
  { label: 'Offline', color: 'grey-6' },
]

// zoznam kanalov
const channels = [
  { name: 'general', icon: 'tag', active: true },
  { name: 'random', icon: 'tag' },
  { name: 'tajny-projekt', icon: 'lock' },
]

// zoznam clenov
const members = ['adam', 'ed', 'peter']
</script>
