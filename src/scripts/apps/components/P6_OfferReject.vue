<template>

  <section class="section-offer--reject">
    <a class="menu" @click="actionMenu"><i class="material-icons">view_list</i></a>
    <h1>We're Sorry :(</h1>
    <p>We weren’t able to meet your expectations at this stage. Sit tight and one of our consultants will be in touch with you shortly.</p>
  </section>

</template>

<script>

export default {
  name: 'offer-reject',
  props: [],
  // beforeRouteEnter (to, from, next) {
  //   next(vm => {
  //     if( $.isEmptyObject(vm.$store.state.inspection) ) {
  //       next('/inspection/'+vm.$route.params.id)
  //     }
  //   })
  // },
  mounted () {
  },
  data () {
    return {
    }
  },
  methods: {
    actionMenu () {
      this.$router.push('/')
    }
  },
  components: {
  },
  computed: {
  },
}
</script>
