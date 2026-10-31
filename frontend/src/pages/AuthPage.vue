<template>
  <!-- hlavny kontajner prihlasovacej a registracnej stranky -->
  <div
    class="bg-dust-grey flex flex-center q-pa-sm q-pa-sm-md"
    style="min-height: 100dvh; overflow: hidden"
  >
    <!-- karta prihlasenia -->
    <div style="width: 100%; max-width: 400px" class="text-center">
      <!-- ikona aplikacie -->
      <q-icon
        name="chat_bubble_outline"
        :size="$q.screen.lt.sm ? '40px' : $q.screen.lt.md ? '48px' : '56px'"
        class="text-pine-teal q-mb-xs q-mb-sm-md"
      />

      <!-- hlavny nadpis s nazvom aplikacie -->
      <div
        class="text-weight-bold text-pine-teal"
        :class="[
          $q.screen.lt.sm
            ? isRegisterMode
              ? 'q-mb-md text-h5'
              : 'q-mb-lg text-h5'
            : $q.screen.lt.md
              ? 'q-mb-xl text-h5'
              : 'q-mb-xl text-h4',
        ]"
      >
        {{ isRegisterMode ? `Registrácia na ${APP_NAME}` : `Vitajte na ${APP_NAME}` }}
      </div>

      <!-- formular pre prihlasenie alebo registraciu -->
      <div class="text-left" :class="$q.screen.lt.sm ? 'q-gutter-y-sm' : 'q-gutter-y-md'">
        <!-- polia zobrazovane iba pri registracii -->
        <template v-if="isRegisterMode">
          <!-- polia pre krstne meno a priezvisko vedla seba -->
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Meno</div>
              <q-input v-model="firstName" bg-color="white" outlined dense placeholder="Meno" />
            </div>
            <div class="col-6">
              <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Priezvisko</div>
              <q-input
                v-model="lastName"
                outlined
                bg-color="white"
                dense
                placeholder="Priezvisko"
              />
            </div>
          </div>

          <!-- pole pre nickname -->
          <div>
            <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Nickname</div>
            <q-input
              v-model="nickname"
              bg-color="white"
              outlined
              dense
              placeholder="Zadajte prezyvku"
            />
          </div>
        </template>

        <!-- pole pre email alebo nick -->
        <div>
          <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">
            {{ isRegisterMode ? 'Email' : 'Email alebo Nickname' }}
          </div>
          <q-input
            v-model="loginIdentifier"
            :type="isRegisterMode ? 'email' : 'text'"
            bg-color="white"
            outlined
            dense
            :placeholder="isRegisterMode ? 'Zadajte email' : 'Zadajte email alebo nick'"
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
            :placeholder="isRegisterMode ? 'Aspoň 8 znakov' : 'Zadajte heslo'"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- pole pre zopakovanie hesla (iba pri registracii) -->
        <div v-if="isRegisterMode">
          <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Zopakujte heslo</div>
          <q-input
            v-model="passwordConfirmation"
            type="password"
            bg-color="white"
            outlined
            dense
            placeholder="Zadajte heslo znova"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- tlacidlo na prechod do aplikacie (pocas cakania na server ukazuje nacitavanie) -->
        <q-btn
          :label="isRegisterMode ? 'Zaregistrovať sa' : 'Prihlásiť sa'"
          color="pine-teal"
          text-color="dust-grey"
          class="full-width text-weight-bold q-mt-md"
          unelevated
          size="md"
          :loading="loading"
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
import {
  notifySuccess,
  notifyError,
  notifyWarning,
  askNotificationPermission,
} from '@/utils/helper_functions'

const router = useRouter()
const chatStore = useChatStore()

const isRegisterMode = ref(false)

// ci prave cakame na odpoved servera (tlacidlo ukazuje nacitavanie)
const loading = ref(false)

// hodnoty z formulara
const firstName = ref('')
const lastName = ref('')
const nickname = ref('')
const loginIdentifier = ref('')
const password = ref('')
const passwordConfirmation = ref('')

// prelozi chybu zo servera
function getErrorMessage(error) {
  // server vobec neodpovedal
  if (!error.response) {
    return 'Server nie je dostupný.'
  }

  // server posiela chyby ako zoznam: { errors: [{ message, rule, field }] }
  const errors = error.response.data.errors
  if (!errors || errors.length === 0) {
    return 'Nastala chyba, skúste to znova.'
  }

  // zobrazime prvu chybu zo zoznamu
  const firstError = errors[0]

  if (firstError.message === 'Invalid user credentials') {
    return 'Nesprávny email/nickname alebo heslo!'
  }
  if (firstError.field === 'nickname' && firstError.rule === 'database.unique') {
    return 'Používateľ s týmto nickom už existuje!'
  }
  if (firstError.field === 'email' && firstError.rule === 'database.unique') {
    return 'Používateľ s týmto emailom už existuje!'
  }
  if (firstError.field === 'email') {
    return 'Zadajte platný email!'
  }
  if (firstError.field === 'password' && firstError.rule === 'minLength') {
    return 'Heslo musí mať aspoň 8 znakov!'
  }
  if (firstError.field === 'password' && firstError.rule === 'maxLength') {
    return 'Heslo môže mať najviac 32 znakov!'
  }
  if (firstError.field === 'passwordConfirmation') {
    return 'Heslá sa nezhodujú!'
  }

  // inu chybu zobrazime tak, ako ju poslal server
  return firstError.message
}

// funkcia na spracovanie prihlasenia / registracie
async function handleSubmit() {
  if (isRegisterMode.value) {
    // kontrola ci pouzivatel vyplnil vsetky polia
    if (
      !firstName.value ||
      !lastName.value ||
      !nickname.value ||
      !loginIdentifier.value ||
      !password.value ||
      !passwordConfirmation.value
    ) {
      notifyWarning('Vyplňte prosím všetky polia!')
      return
    }

    loading.value = true
    try {
      // server skontroluje udaje (unikatny nick a email, dlzka hesla...) a ulozi pouzivatela
      await chatStore.register({
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        nickname: nickname.value.trim(),
        email: loginIdentifier.value.trim(),
        password: password.value,
        passwordConfirmation: passwordConfirmation.value,
      })
    } catch (error) {
      notifyError(getErrorMessage(error))
      loading.value = false
      return
    }
    loading.value = false

    // poziadame prehliadac o povolenie systemovych notifikacii
    askNotificationPermission()
    notifySuccess('Registrácia bola úspešná!')
    router.push('/')
    return
  }

  // spracovanie prihlasenia existujuceho pouzivatela
  // kontrola ci zadal prihlasovacie udaje a heslo
  if (!loginIdentifier.value || !password.value) {
    notifyWarning('Zadajte email/nick aj heslo!')
    return
  }

  loading.value = true
  try {
    // server najde pouzivatela podla emailu alebo nicku a overi heslo
    await chatStore.login(loginIdentifier.value.trim(), password.value)
  } catch (error) {
    notifyError(getErrorMessage(error))
    loading.value = false
    return
  }
  loading.value = false

  // poziadame prehliadac o povolenie systemovych notifikacii
  askNotificationPermission()
  router.push('/')
}
</script>
