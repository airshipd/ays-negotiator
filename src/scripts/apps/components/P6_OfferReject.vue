<template>

  <section class="section-offer--reject">
    <h1>got rejected</h1>
  </section>

</template>

<script>

export default {
  name: 'offer-reject',
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
  },
  components: {
  },
  computed: {
  },
}
</script>
