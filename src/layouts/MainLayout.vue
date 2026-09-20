<template>
  <!-- hlavny layout celej aplikacie -->
  <q-layout view="hHh lpR fFf" class="bg-dust-grey">
    <!-- horna lista -->
    <q-header elevated class="bg-pine-teal text-dust-grey">
      <q-toolbar>
        <!-- tlacidlo na otvorenie laveho menu s kanalmi -->
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />

        <!-- nazov aplikacie -->
        <q-toolbar-title class="text-weight-bold"> nasa aplikacia </q-toolbar-title>

        <!-- aktualny stav prihlaseneho pouzivatela -->
        <q-badge color="fern" text-color="dust-grey" class="q-mr-sm"> Online </q-badge>

        <!-- tlacidlo na otvorenie praveho menu so zoznamom clenov -->
        <q-btn flat dense round icon="people" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <!-- lavy bocny panel so zoznamom kanalov -->
    <q-drawer v-model="leftDrawerOpen" side="left" bordered class="bg-hunter-green text-dust-grey">
      <!-- profil prihlaseneho pouzivatela -->
      <div class="q-pa-md bg-pine-teal text-dust-grey">
        <div class="text-subtitle1 text-weight-bold">Meno Pouzivatela</div>
      </div>

      <q-separator color="fern" />

      <!-- sekcia s kanalmi -->
      <div class="q-pa-sm">
        <div class="row items-center justify-between q-px-sm q-py-xs">
          <span class="text-caption text-dry-sage text-weight-bold">KANALY</span>
          <!-- tlacidlo na pridanie kanala -->
          <q-btn flat dense round size="sm" icon="add" class="text-dry-sage" />
        </div>

        <!-- ukazkovy zoznam kanalov -->
        <q-list dense>
          <!-- verejny kanal 1 (aktivny) -->
          <q-item clickable v-ripple active-class="bg-fern text-dust-grey" :active="true">
            <q-item-section avatar class="text-dust-grey">
              <q-icon name="tag" />
            </q-item-section>
            <q-item-section class="text-dust-grey">general</q-item-section>
          </q-item>

          <!-- verejny kanal 2 -->
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="tag" />
            </q-item-section>
            <q-item-section>random</q-item-section>
          </q-item>

          <!-- sukromny kanal -->
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="lock" />
            </q-item-section>
            <q-item-section>tajny-projekt</q-item-section>
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
      <div class="q-pa-md bg-pine-teal text-weight-bold">Clenovia kanala (3)</div>
      <q-separator color="fern" />

      <q-list dense class="q-pa-sm">
        <!-- clen 1 -->
        <q-item clickable v-ripple>
          <q-item-section>
            <q-item-label>adam</q-item-label>
          </q-item-section>
        </q-item>

        <!-- clen 2 -->
        <q-item clickable v-ripple>
          <q-item-section>
            <q-item-label>ed</q-item-label>
          </q-item-section>
        </q-item>

        <!-- clen 3 -->
        <q-item clickable v-ripple>
          <q-item-section>
            <q-item-label>peter</q-item-label>
          </q-item-section>
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
// zakladne vue funkcie
import { ref } from 'vue'

// stav ci je otvoreny lavy panel (predvolene otvoreny)
const leftDrawerOpen = ref(true)

// stav ci je otvoreny pravy panel so zoznamom pouzivatelov
const rightDrawerOpen = ref(false)

// funkcia na prepinanie laveho menu
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

// funkcia na prepinanie praveho menu
function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>
