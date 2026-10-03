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
            <q-input
              v-model="firstName"
              bg-color="white"
              outlined
              dense
              placeholder="Zadajte meno"
            />
          </div>

          <!-- pole pre priezvisko -->
          <div>
            <div class="text-caption text-weight-bold text-pine-teal q-mb-xs">Priezvisko</div>
            <q-input
              v-model="lastName"
              outlined
              bg-color="white"
              dense
              placeholder="Zadajte priezvisko"
            />
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
import { notifySuccess, notifyError, notifyWarning } from '@/utils/helper_functions'

const router = useRouter()
const chatStore = useChatStore()

const isRegisterMode = ref(false)

// hodnoty z formulara
const firstName = ref('')
const lastName = ref('')
const nickname = ref('')
const loginIdentifier = ref('')
const password = ref('')

// funkcia na spracovanie prihlasenia / registracie
function handleSubmit() {
  if (isRegisterMode.value) {
    // kontrola ci pouzivatel vyplnil vsetky polia
    if (
      !firstName.value ||
      !lastName.value ||
      !nickname.value ||
      !loginIdentifier.value ||
      !password.value
    ) {
      notifyWarning('Vyplňte prosím všetky polia!')
      return
    }

    const cleanNick = nickname.value.trim().toLowerCase()
    const cleanEmail = loginIdentifier.value.trim().toLowerCase()

    // kontrola ci uz nahodou pouzivatel s takym nickom existuje
    if (chatStore.users.find((u) => u.nick.toLowerCase() === cleanNick)) {
      notifyError('Používateľ s týmto nickom už existuje!')
      return
    }

    // kontrola ci uz nahodou pouzivatel s takym emailom existuje
    if (chatStore.users.find((u) => u.email.toLowerCase() === cleanEmail)) {
      notifyError('Používateľ s týmto emailom už existuje!')
      return
    }

    // vytvorenie objektu noveho pouzivatela
    const newUser = {
      name: `${firstName.value.trim()} ${lastName.value.trim()}`,
      nick: nickname.value.trim(),
      email: loginIdentifier.value.trim(),
      password: password.value,
      // novy pouzivatel je predvolene online
      status: 'Online',
    }

    // pridanie noveho pouzivatela do zoznamov v store
    chatStore.users.push(newUser)
    chatStore.allUsers.push(newUser.nick)

    // nastavenie prihlaseneho pouzivatela a presmerovanie na hlavnu stranku
    chatStore.currentUser = newUser.nick
    // novy pouzivatel este nema ziadne kanaly, takze sa nastavi prazdny kanal
    chatStore.selectFirstChannel()

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

  const input = loginIdentifier.value.trim().toLowerCase()

  // zistenie ci pouzivatel s takym emailom alebo nickom existuje
  const user = (chatStore.users || users).find(
    (u) => u.email.toLowerCase() === input || u.nick.toLowerCase() === input,
  )

  if (!user) {
    notifyError('Používateľ s týmto emailom alebo nickom neexistuje!')
    return
  }

  // overenie spravnosti hesla
  if (user.password !== password.value) {
    notifyError('Nesprávne heslo!')
    return
  }

  // ak je vsetko v poriadku tak ulozime pouzivatela a presmerujeme do aplikacie
  chatStore.currentUser = user.nick
  // po prihlaseni otvorime prvy kanal, v ktorom je pouzivatel clenom
  chatStore.selectFirstChannel()
  router.push('/')
}
</script>
