<template>

  <header :class="classObj" v-if="showHeader">
    <nav >
      <div class="nav-wrapper">
        <span class="brand-logo center">{{title}}</span>

        <div class="heading-secondary">
          <div class="header-inspections">
            <div class="right" v-if="currentRoute === 'Negotiations'">
              <div class="header-date">
                <input class="datepicker-negotiations" :value="todayDate" />
              </div>
              <a class="header-icon--logout" href="/logout"><i class="material-icons">exit_to_app</i></a>
            </div>
          </div>
          <div class="inspection-header" v-if="currentRoute === 'Inspection'">
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
              <div class="col">
                <label>Build Date</label>
                {{inspection.buildDate}}
              </div>
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
    mounted () {

    },
    created() {
      this.currentRoute = this.$route.name
    },
    data () {
      return {
        currentRoute: 'Negotiations',
        title: '',
        date: moment(new Date(moment().add(10,'minutes').unix()*1000)).format('YYYY/MM/DD HH:mm:ss'),
        todayDate: moment().format('dddd, MMM DD')
      }
    },
    methods: {
      clickAction () {
        this.action()
      },
      actionMenu () {
        this.$router.push('/')
      },
      actionFinalGoBack () {
        console.log(this.$route.meta.step)
        if( this.$route.meta.step !== 1 ) {
          this.$router.push(`/final/${this.$route.meta.step - 1}/${this.$route.params.id}`)
        } else {
          this.$router.push(`/offer/${this.$route.params.id}`)
        }
      },
      updateTitle (route) {
        console.log('udpate route',route)
        switch(route) {
          case 'Inspection':
            this.title = 'Vehicle Assesment form'
            break
          case 'Offer':
            this.title = 'Report'
            break
          default:
            this.title = ''
        }
      },
    },
    watch: {
      '$route': function(r) {
        this.currentRoute = r.name
      },
      currentRoute: function(n,o) {
        this.updateTitle(n)
      }
    },
    computed: {
      inspection () {
        return this.$store.state.inspection
      },
      showHeader () {
        return this.currentRoute === 'Waiting' || this.currentRoute === 'Offer Reject' || this.currentRoute === 'Offer Accept' || this.currentRoute === 'Finalized' ? false : true
      },
      classObj () {
        console.log(this.currentRoute)
        return {
          'fixed-height': this.currentRoute === 'Negotiations' || this.currentRoute === 'Offer' ? true : false
        }
      }
    },
    components: {
      countdown
    }
}
</script>
