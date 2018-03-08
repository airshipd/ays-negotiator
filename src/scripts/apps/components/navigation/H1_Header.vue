<template>

    <header :class="classObj" v-if="showHeader">
        <nav>
            <div class="nav-wrapper">
                <span class="brand-logo center">{{ title }}</span>

                <div class="heading-secondary">
                    <div class="header-inspections" v-if="currentRoute === 'Negotiations' && isSales">
                        <div class="right">
                            <a class="header-icon--logout" href="/logout"><i class="material-icons">exit_to_app</i></a>
                        </div>

                        <ul class="type-switcher">
                            <router-link tag="li" :to="{path: '/upcoming'}"><a>Upcoming</a></router-link>
                            <router-link tag="li" :to="{path: '/rejected'}"><a>Rejected</a></router-link>
                        </ul>
                    </div>
                    <div class="header-inspections" v-if="currentRoute === 'Negotiations' && !isSales">
                        <div class="right">
                            <div class="header-date">
                                <input class="datepicker-negotiations"/>
                            </div>
                            <a class="header-icon--logout" href="/logout"><i class="material-icons">exit_to_app</i></a>
                        </div>
                    </div>
                    <div class="header-inspections" v-if="currentRoute === 'Admin'">
                        <div class="right">
                            <a class="header-icon--logout" href="/logout"><i class="material-icons">exit_to_app</i></a>
                        </div>

                        <ul class="type-switcher">
                            <router-link tag="li" :to="{name: 'Admin', params: {state: 'nsw'}}"><a>NSW</a></router-link>
                            <router-link tag="li" :to="{name: 'Admin', params: {state: 'vic'}}"><a>VIC</a></router-link>
                            <router-link tag="li" :to="{name: 'Admin', params: {state: 'qld'}}"><a>QLD</a></router-link>
                            <router-link tag="li" :to="{name: 'Admin', params: {state: 'wa'}}"><a>WA</a></router-link>
                            <router-link tag="li" :to="{name: 'Admin', params: {state: 'nt_sa'}}"><a>NT/SA</a></router-link>
                            <router-link tag="li" :to="{name: 'Admin', params: {state: 'tas'}}"><a>TAS</a></router-link>
                            <router-link tag="li" :to="{name: 'Admin', params: {state: 'act'}}"><a>ACT</a></router-link>
                        </ul>
                    </div>
                    <div class="inspection-header" v-if="currentRoute === 'Inspection' || currentRoute === 'Pending Inspection'">
                        <div class="left">
                            <a @click="actionMenu"><i class="icon-back"></i></a>
                        </div>
                        <div class="row">
                            <div class="col">
                                <label>Make</label>
                                {{inspection.make}}
                            </div>
                            <div class="col">
                                <label>Model</label>
                                {{inspection.model}}
                            </div>
                            <div class="col">
                                <label>Year</label>
                                {{inspection.year}}
                            </div>
                            <div class="col">
                                <label>Customer</label>
                                {{inspection.customerName}}
                            </div>
                        </div>

                        <div class="right" v-show="currentRoute === 'Inspection'">
                            <a class="btn" @click="$store.commit('reschedule')">Reschedule</a>
                        </div>
                    </div>
                    <div class="header-report" v-if="currentRoute === 'Offer'">
                        <div class="left">
                            <a @click="actionMenu"><i class="icon-menu"></i></a>
                            Your {{inspection.year}} {{inspection.make}} {{inspection.model}}
                        </div>
                    </div>
                    <div class="header-final" v-if="this.$route.meta.final">
                        <div class="left">
                            <a @click="actionFinalGoBack"><i class="icon-back"></i></a>
                        </div>
                        <div class="row">
                            <div :class="{col: true, active: this.$route.meta.step === 1 }">
                                <i class="icon-user"></i>
                                Customer Details
                            </div>
                            <div :class="{col: true, active: this.$route.meta.step === 2 }">
                                <i class="icon-car2"></i>
                                Car Details
                            </div>
                            <div :class="{col: true, active: this.$route.meta.step === 3 }">
                                <i class="icon-moneySymbol"></i>
                                Finance
                            </div>
                            <div :class="{col: true, active: this.$route.meta.step === 4 }">
                                <i class="icon-bank"></i>
                                Bank Details
                            </div>
                            <div :class="{col: true, active: this.$route.meta.step === 5 }">
                                <i class="icon-complete"></i>
                                Contract Of Sale
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    </header>

</template>

<script>
    import countdown from '../components/C2_Countdown.vue'
    import moment from 'moment'

    export default {
        name: 'h-1-header',
        props: ['label', 'action', 'fullWidth'],
        mounted() {

        },
        created() {
            this.currentRoute = this.$route.name
        },
        data() {
            return {
                currentRoute: 'Negotiations',
                title: '',
                date: moment(new Date(moment().add(10, 'minutes').unix() * 1000)).format('YYYY/MM/DD HH:mm:ss'),
                isSales: window.isSales, //whether the current user is a sales consultant
            }
        },
        methods: {
            clickAction() {
                this.action()
            },
            actionMenu() {
                this.$router.push('/')
            },
            actionFinalGoBack() {
                console.log(this.$route.meta.step)
                if (this.$route.meta.step !== 1) {
                    this.$router.push(`/final/${this.$route.meta.step - 1}/${this.$route.params.id}`)
                } else {
                    this.$router.push(`/offer/${this.$route.params.id}`)
                }
            },
            updateTitle(route) {
                switch (route) {
                    case 'Inspection':
                        this.title = 'Vehicle Assesment form';
                        break;
                    case 'Offer':
                        this.title = 'Report';
                        break;
                    case 'Pending Inspection':
                        this.title = 'Pending Job Form';
                        break;
                    default:
                        this.title = '';
                }
            },
        },
        watch: {
            '$route': function (r) {
                this.currentRoute = r.name;
            },
            currentRoute: function (n, o) {
                this.updateTitle(n)
            }
        },
        computed: {
            inspection() {
                return this.$store.state.inspection
            },
            showHeader() {
                return ['Waiting', 'Offer Reject', 'Offer Accept'].indexOf(this.currentRoute) === -1;
            },
            classObj() {
                return {
                    'fixed-height': ['Negotiations', 'Admin', 'Offer'].indexOf(this.currentRoute) !== -1
                }
            }
        },
        components: {
            countdown
        }
    }
</script>
