import Vue from 'vue'
import $ from 'jquery'
import App from './app.vue'
import Vuex from 'vuex'
import store from './store.js'
window.$ = window.jQuery = $

new Vue({
  el: '#app',
  render: h => h(App),
  store
})
