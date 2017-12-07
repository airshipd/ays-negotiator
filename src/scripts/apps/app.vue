<template>

  <div class="page" id="page">
    <h-1-header></h-1-header>

    <main role="main" class="container-fluid">

      <transition name="fade" mode="out-in">
        <router-view/>
      </transition>

    </main>

    <o-1-modal-review v-if="showReviewModal"></o-1-modal-review>
  </div>

</template>

<script>

import H1Header from './components/navigation/H1_Header.vue'
import O1ModalReview from './components/overlays/O1_Review.vue'

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
    H1Header,
    O1ModalReview
  },
  computed: {
    showReviewModal () {
      return this.$store.state.overlays.review
    },
  }
}
</script>
