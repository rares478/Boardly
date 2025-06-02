import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'

import { useAuthStore } from '@/store'

const app = createApp(App)
app.use(createPinia())
app.use(router)

useAuthStore().hydrate()

app.mount('#app')
