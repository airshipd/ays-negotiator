import Vue from 'vue'
import Vuex from 'vuex'
// import * as actions from './actions'
// import * as getters from './getters'

Vue.use(Vuex);

export default new Vuex.Store({
    strict: true,
    state: {
        inspection: {},
        options: [],
        overlays: {
            review: false,
            signatureCustomer: false,
            signatureRep: false
        }
    },
    mutations: {
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