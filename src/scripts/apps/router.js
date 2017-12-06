import Vue from 'vue'
import Router from 'vue-router'

// Pages import
import Negotiations from './components/P1_Negotiations.vue'
import Inspection from './components/P2_Inspection.vue'
import Waiting from './components/P3_Waiting.vue'
import Report from './components/P4_Report.vue'

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
      path: '/report/:id',
      name: 'Report',
      component: Report
    },
  ]
})

router.afterEach((to, from) => {
  setTimeout(function () { window.scrollTo(0,0) }, 150)
})

export default router
