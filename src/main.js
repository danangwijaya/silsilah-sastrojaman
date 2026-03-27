import { createApp } from 'vue'
import { Quasar, Dialog, Notify } from 'quasar'
import { createPinia } from 'pinia'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Import App Component
import App from './App.vue'

// Import Firebase (will initialize it)
import './boot/firebase'

const myApp = createApp(App)

myApp.use(createPinia())
myApp.use(Quasar, {
  plugins: {
    Dialog,
    Notify
  }, // import Quasar plugins and add here
  config: {
    brand: {
      // primary: '#e46262',
      // ... or all other brand colors
    },
    notify: { /* look at QuasarConfOptions from the API card */ },
    loading: { /* look at QuasarConfOptions from the API card */ }
  }
})

myApp.mount('#app')
