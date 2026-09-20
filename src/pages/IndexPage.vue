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
      <div>
        <q-btn flat dense icon="info" class="text-pine-teal" />
      </div>
    </div>

    <!-- priestor pre zoznam sprav -->
    <div class="col q-pa-md overflow-auto">
      <!-- ukazkova sprava 1 (iny pouzivatel) -->
      <div class="q-mb-md q-pa-sm bg-white rounded-borders shadow-1" style="max-width: 70%">
        <div class="text-weight-bold text-hunter-green">
          ed <span class="text-caption text-grey">12:30</span>
        </div>
        <div class="text-dark">Ahoj vsetci, toto je ukazkova sprava v kanali.</div>
      </div>

      <!-- ukazkova sprava 2 (iny pouzivatel - peter) -->
      <div class="q-mb-md q-pa-sm bg-white rounded-borders shadow-1" style="max-width: 70%">
        <div class="text-weight-bold text-hunter-green">
          peter <span class="text-caption text-grey">12:32</span>
        </div>
        <div class="text-dark">
          Pozdravujem <span class="text-weight-bold text-hunter-green">@moj_nick</span>, pozri si
          novy dizajn!
        </div>
      </div>

      <!-- ukazkova sprava 3 (moja odoslana sprava) -->
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

    <!-- spodny fixny prikazovy riadok / input na pisanie sprav -->
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
        <q-btn round color="fern" icon="send" text-color="dust-grey" @click="sendMessage" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
// zakladne vue funkcie
import { ref } from 'vue'

// text aktualne pisanej spravy v inpute
const messageText = ref('')

// jednoducha funkcia na odoslanie spravy
function sendMessage() {
  if (messageText.value.trim() !== '') {
    // zatial len vypis do konzoly pre test
    console.log('Odoslana sprava:', messageText.value)
    // vycistenie pola
    messageText.value = ''
  }
}
</script>
