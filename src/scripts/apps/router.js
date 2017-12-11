import Vue from 'vue'
import Router from 'vue-router'

// Pages import
import Negotiations from './components/P1_Negotiations.vue'
import Inspection from './components/P2_Inspection.vue'
import Waiting from './components/P3_Waiting.vue'
import Offer from './components/P4_Offer.vue'
import OfferAccept from './components/P5_OfferAccept.vue'
import OfferReject from './components/P6_OfferReject.vue'
import Final1 from './components/P7_Final1.vue'
import Final2 from './components/P8_Final2.vue'
import Final3 from './components/P9_Final3.vue'
import Final4 from './components/P10_Final4.vue'
import Final5 from './components/P11_Final5.vue'
import Final6 from './components/P12_Final6.vue'

Vue.use(Router)

const router = new Router({
  scrollBehavior (to, from, savedPosition) {
    return { x: 0, y: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Negotiations',
      component: Negotiations
    },
    {
      path: '/inspection/:id',
      name: 'Inspection',
      component: Inspection
    },
    {
      path: '/waiting/:id',
      name: 'Waiting',
      component: Waiting,
    },
    {
      path: '/offer/:id',
      name: 'Offer',
      component: Offer
    },
    {
      path: '/offer/:id/accept',
      name: 'Offer Accept',
      component: OfferAccept
    },
    {
      path: '/offer/:id/reject',
      name: 'Offer Reject',
      component: OfferReject
    },
    {
      path: '/final/1/:id',
      name: 'Final 1',
      component: Final1
    },
    {
      path: '/final/2/:id',
      name: 'Final 2',
      component: Final2
    },
    {
      path: '/final/3/:id',
      name: 'Final 3',
      component: Final3
    },
    {
      path: '/final/1/:id',
      name: 'Final 4',
      component: Final4
    },
    {
      path: '/final/1/:id',
      name: 'Final 5',
      component: Final5
    },
    {
      path: '/final/1/:id',
      name: 'Final 6',
      component: Final6
    },
  ]
})

export default router
