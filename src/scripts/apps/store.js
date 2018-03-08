import Vue from 'vue'
import Vuex from 'vuex'
// import * as actions from './actions'
// import * as getters from './getters'

Vue.use(Vuex);

export default new Vuex.Store({
    strict: true,
    state: {
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
        updateUserLocation(state, data) {
            state.userLocation = Object.assign({}, state.userLocation, data)
        },
        updateInspection(state, data) {
            state.inspection = Object.assign({}, state.inspection, data)
        },
        updateOptions(state, data) {
            state.options = Object.assign({}, state.options, data)
        },
        updateReviewModalApperance(state, value) {
            state.overlays.review = value
        },
        updateSignatureModalApperance(state, value) {
            state.overlays.signature = value
        },
        reschedule: () => {}
    }
});