import Vue from 'vue'
import Router from 'vue-router'

// Pages import
import Negotiations from './components/P1_Negotiations.vue'
import Inspection from './components/P2_Inspection.vue'
import Waiting from './components/P3_Waiting.vue'
import Offer from './components/P4_Offer.vue'
import OfferAccept from './components/P5_OfferAccept.vue'
import OfferReject from './components/P6_OfferReject.vue'
import Final1 from './components/P8_Final1.vue'
import Final2 from './components/P7_Final2.vue'
import Final3 from './components/P9_Final3.vue'
import Final4 from './components/P10_Final4.vue'
import Final5 from './components/P11_Final5.vue'
import OfferFinalized from './components/P12_OfferFinalized.vue'
import PendingInspection from './components/P13_PendingInspection.vue'
import InspectionDetails from './components/P14_InspectionDetails.vue'
import CustomerContract from './components/P15_CustomerContract.vue'

Vue.use(Router);

const router = new Router({
    // mode: 'history',
    // base: '/app',
    scrollBehavior(to, from, savedPosition) {
        return {x: 0, y: 0}
    },
    routes: [
        {
            path: '/',
            redirect: to => {
                return !window.currentUser ? false :
                    window.currentUser.isAdmin ? '/admin/nsw' :
                    window.currentUser.isNegotiator || window.currentUser.isSeller ? '/rejected' :
                    window.currentUser.isSales ? '/my-sales' :
                        '/upcoming';
            }
        },
        {
            path: '/admin/:state(nsw|vic|qld|wa|nt_sa|tas|act)',
            name: 'Admin',
            component: Negotiations,
            props: true,
            beforeEnter: (to, from, next) => {
                next(window.currentUser.isAdmin ? true : '/');
            }
        },
        {
            path: '/:type(upcoming|rejected|unassigned|submitted|my-sales|finalized|unopened|opened)/:date(\\d\\d\\d\\d-\\d\\d-\\d\\d)?',
            name: 'Negotiations',
            component: Negotiations,
            props: true,
            beforeEnter: (to, from, next) => {
                next(window.currentUser.isAdmin ? '/' : true);
            }
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
            component: Final1,
            meta: {
                step: 1,
                final: true
            }
        },
        {
            path: '/final/2/:id',
            name: 'Final 2',
            component: Final2,
            meta: {
                step: 2,
                final: true
            }
        },
        {
            path: '/final/3/:id',
            name: 'Final 3',
            component: Final3,
            meta: {
                step: 3,
                final: true
            }
        },
        {
            path: '/final/4/:id',
            name: 'Final 4',
            component: Final4,
            meta: {
                step: 4,
                final: true
            }
        },
        {
            path: '/final/5/:id',
            name: 'Final 5',
            component: Final5,
            meta: {
                step: 5,
                final: true
            }
        },
        {
            path: '/offer-finalized',
            name: 'Finalized',
            component: OfferFinalized
        },
        {
            path: '/pending-inspection/:id',
            name: 'Pending Inspection',
            component: PendingInspection
        },
        {
            path: '/inspection-details/:id',
            name: 'Inspection Details',
            component: InspectionDetails
        },
        {
            path: '/contract/:id',
            name: 'Customer Contract',
            component: CustomerContract
        },
    ]
});

router.beforeEach((to, from, next) => {
    if (!window.as9duas09usa && to.name !== 'Customer Contract' && to.name !== 'Finalized') {
        window.location = '/login';
    } else {
        next();
    }
});


export default router;
