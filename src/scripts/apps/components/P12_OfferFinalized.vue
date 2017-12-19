<template>

  <section class="section-offerFinalized">
    <a class="menu" @click="actionMenu"><i class="icon-menu"></i></a>
    <h1>Offer Finalized</h1>
    <p>Thank You for using Are You Selling </p>
  </section>

</template>

<script>

export default {
  name: 'finalized',
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
