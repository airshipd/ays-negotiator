<template>

  <section class="section-waiting">
    <h3>We're just reviewing your offer</h3>
    <countdown :time="date" v-once></countdown>
    <div class="loader">
      <p v-if="loadingState === 1">Checking details of your vehicle</p>
      <p v-if="loadingState === 2">We're just comparing your {{inspection.make}} {{inspection.model}} with others in the market</p>
      <p v-if="loadingState === 3">Sit tight, one of our team members is now preparing your offer, we won't be a minute!</p>
      <div :class="stateClass1"></div>
      <div :class="stateClass2"></div>
      <div :class="stateClass3"></div>
    </div>
    <div class="mountains"></div>
    <div class="vehicles">
      <div v-if="inspection.justBoughtDescription" class="messageBubbble">{{inspection.justBoughtDescription}}</div>
    </div>
  </section>

</template>

<script>
import moment from 'moment'
import countdown from './components/C2_Countdown.vue'

export default {
  name: 'waiting',
  props: [],
  beforeRouteEnter (to, from, next) {
     next(vm => {
      if( $.isEmptyObject(vm.$store.state.inspection) ) {
        next('/inspection/'+vm.$route.params.id)
      }
    })
  },
  mounted () {
    window.setInterval(() => {
      this.loadingState = 2
    },1000*30)

    window.setInterval(() => {
      this.loadingState = 3
    },1000*60)

    window.setInterval(() => {
      this.$router.push('/offer/'+this.$route.params.id)
    },1000*80)
  },
  data () {
    return {
      loadingState: 1,
      date: moment(new Date(moment().add(90,'seconds').unix()*1000)).format('YYYY/MM/DD HH:mm:ss')
    }
  },
  methods: {
  },
  components: {
    countdown
  },
  computed: {
    inspection () {
      return this.$store.state.inspection
    },
    stateClass1 () {
      return {
        'state-1': true,
        'active': this.loadingState === 1
      }
    },
    stateClass2 () {
      return {
        'state-2': true,
        'active': this.loadingState === 2
      }
    },
    stateClass3 () {
      return {
        'state-3': true,
        'active': this.loadingState === 3
      }
    }
  },
}
</script>
