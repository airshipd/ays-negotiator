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
  ]
})

router.afterEach((to, from) => {

})

export default router
