<template>

  <div class="page" id="page">
    <h-1-header></h-1-header>

    <main role="main" class="container-fluid">

      <transition name="fade" mode="out-in">
        <router-view/>
      </transition>

    </main>
  </div>

</template>

<script>

import H1Header from './components/navigation/H1_Header.vue'

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
    H1Header
  },
  computed: {
  }
}
</script>
