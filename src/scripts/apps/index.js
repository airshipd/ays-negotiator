import Vue from 'vue'
import App from './app.vue'
import Vuex from 'vuex'
import store from './store.js'
import router from './router'
import { googleMapKey } from './config.js'
import * as VueGoogleMaps from 'vue2-google-maps'

//setup jquery and plugin dependacies
let $ = require('jquery')
window.jQuery = window.$ = $
require('../main/vendor/jquery.countdown.js')

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
