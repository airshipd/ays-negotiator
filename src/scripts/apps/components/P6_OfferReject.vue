<template>

  <section class="section-offer--reject">
    <a class="menu" @click="actionMenu"><i class="icon-menu"></i></a>
    <h1>We're Sorry :(</h1>
    <p>We weren’t able to meet your expectations at this stage. Sit tight and one of our consultants will be in touch with you shortly.</p>
  </section>

</template>

<script>

export default {
  name: 'offer-reject',
  props: [],
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
