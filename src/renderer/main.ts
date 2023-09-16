import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { QuailUI } from 'quail-ui'

import 'quail-ui/dist/style.css'
import './style.scss';

const pinia = createPinia()
const app = createApp(App);

app.use(QuailUI, {});
app.use(pinia)
app.mount('#app');

