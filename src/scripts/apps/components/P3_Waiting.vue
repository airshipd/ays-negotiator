<template>

  <section class="section-waiting">
    <h3>We're just reviewing your offer</h3>
    <countdown></countdown>
    <p>Checking details of your vehicle</p>
    <div class="mountains"></div>
    <div class="vehicles"></div>
  </section>

</template>

<script>
import moment from 'moment'
import countdown from './components/C2_Countdown.vue'

export default {
  name: 'waiting',
  props: [],
  mounted () {
    // window.setInterval(() => {
    //     this.now = moment().unix()
    // },1000);
  },
  data () {
    return {
    //   date: moment().minute(10).unix(),
    //   now: moment().unix(),
    }
  },
  methods: {
  },
  components: {
    countdown
  },
  computed: {
    // seconds () {
    //   if( this.date ) {
    //     console.log('test', moment().unix(this.date))
    //     // return moment().from(moment().unix(this.now)).format('ss')
    //   }
    // },
    // minutes () {
    //   if( this.date ) {
    //     // return moment(moment().unix(this.date)).from(moment().unix(this.now)).format('mm')
    //   }
    // },
  },
  filters: {
    // 'two_digits': function (value) {
    //   if(value.toString().length <= 1) {
    //     return "0"+value.toString()
    //   }
    //   return value.toString()
    // }
  }
}
</script>
