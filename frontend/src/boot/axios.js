import { defineBoot } from '#q-app'
import axios from 'axios'
import { SERVER_URL } from '@/config/app'

// adresa backendu - vsetky poziadavky idu sem
const api = axios.create({
  baseURL: `${SERVER_URL}/api/v1`,
  headers: {
    // chceme odpovede zo servera vzdy ako JSON
    Accept: 'application/json',
  },
})

// pred kazdou poziadavkou na server pridame token prihlaseneho pouzivatela
// server podla tokenu vie, kto poziadavku poslal
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// pri starte aplikacie spristupnime api aj v komponentoch ako this.$api
export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api
})

// api importujeme v store a komponentoch: import { api } from '@/boot/axios'
export { api }
