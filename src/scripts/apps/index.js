import Vue from 'vue'
import $ from 'jquery'
import App from './app.vue'
import Vuex from 'vuex'
import store from './store.js'
import router from './router'
import { googleMapKey } from './config.js'
import * as VueGoogleMaps from 'vue2-google-maps'
window.$ = window.jQuery = $

Vue.use(Vuex)
Vue.use(VueGoogleMaps, {
  load: {
    key: googleMapKey,
    libraries: 'places',
  }
})

new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router
})
