<template>

  <div id="app" class="inspections">
    <transition name="fade" mode="out-in">
      <router-view/>
    </transition>
  </div>

</template>

<script>

export default {
  name: 'app',
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
  }
}
</script>
