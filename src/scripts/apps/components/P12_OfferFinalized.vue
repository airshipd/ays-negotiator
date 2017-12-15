<template>

  <section class="section-offerFinalized">
    <a class="menu" @click="actionMenu"><i class="material-icons">view_list</i></a>
    <h1>Offer Finalized</h1>
    <p>Thank You for using Are You Selling </p>
  </section>

</template>

<script>

export default {
  name: 'finalized',
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
