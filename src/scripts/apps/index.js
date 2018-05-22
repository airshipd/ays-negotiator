import Vue from 'vue'
import App from './app.vue'
import Vuex from 'vuex'
import store from './store.js'
import router from './router'
import VeeValidate from 'vee-validate'
import validateConfig from './validateConfig.js'
import { googleMapKey } from './config.js'
import * as VueGoogleMaps from 'vue2-google-maps'
import ValidationMixin from './services/ValidationMixin.js'
import Toasted from 'vue-toasted'
import axios from 'axios'

//setup jquery and plugin dependacies
let $ = require('jquery')
window.jQuery = window.$ = $
require('../main/vendor/jquery.countdown.js')
require('../main/vendor/picker')
require('../main/vendor/picker.date')

//inject all vue based plugins
Vue.use(Vuex)
Vue.use(VeeValidate, validateConfig)
Vue.use(VueGoogleMaps, {
  load: {
    key: googleMapKey,
    libraries: 'places',
    language: 'en-AU',
  }
})
Vue.use(Toasted)
Vue.mixin(ValidationMixin)

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// setup global event bus system
window.eventBus = new Vue()

//define global filters
Vue.filter('currency', function (value,precision) {
  if (!value) return ''
  return (precision) ? '$' + parseFloat(value).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '$' + parseInt(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
})

new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router
})
