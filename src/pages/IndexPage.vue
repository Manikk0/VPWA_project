<template>
  <!-- hlavna stranka s chatovacim oknom -->
  <q-page class="column justify-between bg-dust-grey">
    <!-- horna lista aktualne vybraneho kanala -->
    <div class="q-pa-md bg-dry-sage text-pine-teal row items-center justify-between shadow-1">
      <div>
        <span class="text-h6 text-weight-bold"># general</span>
        <span class="text-caption q-ml-sm">(Verejny kanal pre vsetkych)</span>
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
        <q-btn flat dense round icon="logout" class="text-pine-teal">
          <q-tooltip>Opustit kanal</q-tooltip>
        </q-btn>

        <!-- tlacidlo na zrusenie kanala -->
        <q-btn v-if="isChannelAdmin" flat dense round icon="delete" class="text-pine-teal">
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
        <div class="text-dark">Ahoj vsetci, toto je ukazkova sprava v kanali.</div>
      </div>

      <!-- ukazkova sprava 2 -->
      <div
        class="q-mb-md q-pa-sm bg-dry-sage rounded-borders shadow-2 mentioned-message"
        style="max-width: 70%"
      >
        <!-- hlavicka spravy s menom odosielatela -->
        <div class="text-weight-bold text-hunter-green">
          peter <span class="text-caption text-grey-7">12:32</span>
        </div>

        <!-- text spravy kde je pouzivatel oznaceny -->
        <div class="text-dark q-mt-xs">
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

    <!-- spodny prikazovy riadok -->
    <div class="q-pa-md bg-pine-teal">
      <div class="row items-center q-gutter-sm">
        <!-- textove pole pre spravu alebo prikaz -->
        <q-input
          v-model="messageText"
          dense
          outlined
          bg-color="white"
          placeholder="Napis spravu alebo prikaz (napr. /join, /invite, /kick)..."
          class="col"
        />

        <!-- tlacidlo na odoslanie -->
        <q-btn round color="fern" icon="send" text-color="dust-grey" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, inject } from 'vue'

// funkcia na prepnutie praveho panelu so zoznamom clenov z layoutu
const toggleRightDrawer = inject('toggleRightDrawer', () => {})

// zobrazenie prvkov pre spravcu kanala
const isChannelAdmin = ref(true)

// ukazkovy text v prikazovom riadku
const messageText = ref('')
</script>
