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
    },
    inspection: {},
    options: [],
    overlays: {
      review: false,
      signatureCustomer: false,
      signatureRep: false
    }
  },
  mutations: {
    updateLocation(state, data) {
      state.location = Object.assign({}, state.location, data)
    },
    updateUserLocation(state, data) {
      state.userLocation = Object.assign({}, state.userLocation, data)
    },
    updateInspection(state,data) {
      state.inspection = Object.assign({}, state.inspection, data)
    },
    updateOptions(state,data) {
      state.options = Object.assign({}, state.inspection, data)
    },
    updateReviewModalApperance(state,value) {
      state.overlays.review = value
    },
    updateSignaturCustomereModalApperance(state,value) {
      state.overlays.signatureCustomer = value
    },
    updateSignatureRepModalApperance(state,value) {
      state.overlays.signatureRep = value
    }
  }
})
