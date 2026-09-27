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
          <q-input
            v-model="email"
            type="email"
            bg-color="white"
            outlined
            dense
            placeholder="Zadajte email"
          />
        </div>

        <!-- pole pre heslo -->
        <div>
          <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Heslo</div>
          <q-input
            v-model="password"
            type="password"
            bg-color="white"
            outlined
            dense
            placeholder="Zadajte heslo"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- tlacidlo na prechod do aplikacie -->
        <q-btn
          :label="isRegisterMode ? 'Zaregistrovať sa' : 'Prihlásiť sa'"
          color="pine-teal"
          text-color="dust-grey"
          class="full-width text-weight-bold q-mt-md"
          unelevated
          size="md"
          @click="handleSubmit"
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
import { useRouter } from 'vue-router'
import { APP_NAME } from '@/config/app'
import { useChatStore } from '@/stores/chatStore'
import { users } from '@/mockData'
import { Notify } from 'quasar'

const router = useRouter()
const chatStore = useChatStore()

const isRegisterMode = ref(false)

// hodnoty z formulara
const email = ref('')
const password = ref('')

// funkcia na spracovanie prihlasenia
function handleSubmit() {
  if (isRegisterMode.value) {
    router.push('/')
    return
  }

  // kontrola ci zadal email a heslo
  if (!email.value || !password.value) {
    Notify.create({
      type: 'warning',
      message: 'Zadajte email aj heslo!',
    })
    return
  }

  // zistenie ci pouzivatel s takym emailom existuje
  const user = users.find((u) => u.email === email.value)
  if (!user) {
    Notify.create({
      type: 'negative',
      message: 'Používateľ s týmto emailom neexistuje!',
    })
    return
  }

  // overenie spravnosti hesla
  if (user.password !== password.value) {
    Notify.create({
      type: 'negative',
      message: 'Nesprávne heslo!',
    })
    return
  }

  // ak je vsetko v poriadku tak ulozime pozivatela a presmerujeme do aplikacie
  chatStore.currentUser = user.nick
  router.push('/')
}
</script>
