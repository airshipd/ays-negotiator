import Vue from 'vue'
import App from './app.vue'
import Vuex from 'vuex'
import store from './store.js'
import router from './router'
import VeeValidate from 'vee-validate';
import { googleMapKey } from './config.js'
import * as VueGoogleMaps from 'vue2-google-maps'

//setup jquery and plugin dependacies
let $ = require('jquery')
window.jQuery = window.$ = $
require('../main/vendor/jquery.countdown.js')

//inject all vue based plugins
Vue.use(Vuex)
Vue.use(VeeValidate, { inject: false })
Vue.use(VueGoogleMaps, {
  load: {
    key: googleMapKey,
    libraries: 'places',
  }
})

// setup global event bus system
window.eventBus = new Vue()

//define global filters
Vue.filter('currency', function (value,precision) {
  if (!value) return ''
  return (precision) ? '$' + parseFloat(value).toFixed(2) : '$' + parseInt(value)
})

new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router
})
