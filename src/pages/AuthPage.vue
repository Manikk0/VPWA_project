<template>
  <!-- hlavny kontajner prihlasovacej a registracnej stranky -->
  <div class="fullscreen bg-dust-grey flex flex-center q-pa-md">
    <!-- karta prihlasenia -->
    <div style="width: 100%; max-width: 400px" class="text-center">
      <!-- ikona aplikacie -->
      <q-icon name="chat_bubble_outline" size="56px" class="text-pine-teal q-mb-md" />

      <!-- hlavny nadpis s nazvom aplikacie -->
      <div class="text-h4 text-weight-bold text-pine-teal q-mb-lg">
        {{ isRegisterMode ? `Registrácia na ${APP_NAME}` : `Vitajte na ${APP_NAME}` }}
      </div>

      <!-- formular pre prihlasenie alebo registraciu -->
      <div class="q-gutter-y-md text-left">
        <!-- polia zobrazovane iba pri registracii -->
        <template v-if="isRegisterMode">
          <!-- pole pre krstne meno -->
          <div>
            <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Meno</div>
            <q-input bg-color="white" outlined dense placeholder="Zadajte meno" />
          </div>

          <!-- pole pre priezvisko -->
          <div>
            <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Priezvisko</div>
            <q-input outlined bg-color="white" dense placeholder="Zadajte priezvisko" />
          </div>

          <!-- pole pre nickname -->
          <div>
            <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Nickname</div>
            <q-input bg-color="white" outlined dense placeholder="Zadajte prezyvku" />
          </div>
        </template>

        <!-- pole pre email -->
        <div>
          <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Email</div>
          <q-input type="email" bg-color="white" outlined dense placeholder="Zadajte email" />
        </div>

        <!-- pole pre heslo -->
        <div>
          <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Heslo</div>
          <q-input type="password" bg-color="white" outlined dense placeholder="Zadajte heslo" />
        </div>

        <!-- tlacidlo na prechod do aplikacie -->
        <q-btn
          to="/"
          :label="isRegisterMode ? 'Zaregistrovať sa' : 'Prihlásiť sa'"
          color="pine-teal"
          text-color="dust-grey"
          class="full-width text-weight-bold q-mt-md"
          unelevated
          size="md"
        />

        <!-- prepinanie medzi prihlasenim a registraciou -->
        <div class="text-center q-pt-sm text-pine-teal text-body2">
          {{ isRegisterMode ? 'Už máte účet?' : 'Ešte nemáte účet?' }}
          <span
            class="text-weight-bold cursor-pointer text-fern text-decoration-underline q-ml-xs"
            @click="isRegisterMode = !isRegisterMode"
          >
            {{ isRegisterMode ? 'Prihlásiť sa' : 'Vytvoriť' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { APP_NAME } from '@/config/app'
const isRegisterMode = ref(false)
</script>
