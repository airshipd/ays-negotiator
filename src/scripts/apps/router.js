import Vue from 'vue'
import Router from 'vue-router'

// Pages import
import Negotiations from './components/P1_Negotiations.vue'
import Inspection from './components/P2_Inspection.vue'
import Waiting from './components/P3_Waiting.vue'
import Offer from './components/P4_Offer.vue'

Vue.use(Router)

const router = new Router({
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
      component: Waiting
    },
    {
      path: '/offer/:id',
      name: 'Offer',
      component: Offer
    },
  ]
})

router.afterEach((to, from) => {
  setTimeout(function () { window.scrollTo(0,0) }, 150)
})

export default router
