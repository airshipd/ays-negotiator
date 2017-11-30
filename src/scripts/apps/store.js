import Vue from 'vue'
import Vuex from 'vuex'
// import * as actions from './actions'
// import * as getters from './getters'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: true,
  state: {
    location: {
      lat: 0,
      lng: 0
    },
    userLocation: {
      lat: 0,
      lng: 0
    }
  },
  mutations: {
    updateLocation(state, data) {
      state.location = Object.assign({}, state.location, data)
    },
    updateUserLocation(state, data) {
      state.userLocation = Object.assign({}, state.userLocation, data)
    }
  }
})
