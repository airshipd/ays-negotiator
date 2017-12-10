<template>

  <section class="section-offer--accept">

    <div class="section-offer--acceptWrap">
      <h1>Congratulations</h1>
      <p>Here's what happens next:</p>
      <div class="row">
        <div class="col m3"><i class="icon-paper"></i>Fill out remaining paperwork with the vehicle inspector</div>
        <div class="col m3"><i class="icon-money"></i>You will receive your money before we collect the vehicle</div>
        <div class="col m3"><i class="icon-car"></i>We come and collect the car - and that’s it !</div>
      </div>
      <b-1-button :action="actionProceed" :label="'Proceed to Paperwork'"></b-1-button>
    </div>
  </section>

</template>

<script>
import b1Button from './buttons/B1_button.vue'

export default {
  name: 'offer-accept',
  props: [],
  beforeRouteEnter (to, from, next) {
    next(vm => {
      if( $.isEmptyObject(vm.$store.state.inspection) ) {
        next('/inspection/'+vm.$route.params.id)
      }
    })
  },
  mounted () {
  },
  data () {
    return {
    }
  },
  methods: {
    actionProceed () {
      this.$router.push('/final/1/'+this.$route.params.id)
    }
  },
  components: {
    b1Button
  },
  computed: {
  },
}
</script>
