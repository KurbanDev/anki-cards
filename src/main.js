import './assets/main.css'

import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import {KEY} from "@/constants.js";

const params = new URLSearchParams(window.location.search);
const key = params.get("key");

if (key === KEY) {
    const app = createApp(App)

    app.use(router)

    app.mount('#app')
}
