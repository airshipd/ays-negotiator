<template>

  <header class="z-depth-2" v-if="showHeader">
    <nav >
      <div class="nav-wrapper">
        <a href="/" class="brand-logo center">{{title}}</a>

        <div class="heading-secondary">
          <div class="left" v-if="currentRoute === 'Negotiations'">
            <a class="header-icon--list" href="/"><i class="material-icons">view_list</i></a>
            <ul class="header-list">
              <li>Nearby</li>
              <li>Up Coming</li>
            </ul>
          </div>
          <div class="right" v-if="currentRoute === 'Negotiations'">
            <div class="header-date"></div>
            <a class="header-icon--logout" href="/logout"><i class="material-icons">exit_to_app</i></a>
          </div>
          <div class="left" v-if="currentRoute === 'Inspection'">
            <a href="/"><i class="material-icons">arrow_back</i></a>
          </div>
          <div class="inspection-header" v-if="currentRoute === 'Inspection'">
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
                {{buildDate}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>

</template>

<script>
  export default {
    name: 'buttons-b-3-button',
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
      }
    },
    methods: {
      clickAction () {
        this.action()
      },
      updateTitle (route) {
        console.log('udpate route',route)
        switch(route) {
          case 'Inspection':
            this.title = 'Vehicle Assesment form'
            break
          case 'Report':
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
      buildDate () {
        let theDate = null
        if( this.inspection.buildDate != null ) {
          let d = new Date(this.inspection.buildDate.date)
          theDate = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
        }
        return theDate
      },
      showHeader () {
        return this.currentRoute === 'Waiting' || this.currentRoute === 'decline' ? false : true
      }

    }
}
</script>
