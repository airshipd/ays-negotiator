<template>
  <div class="row">
    <h1>test</h1>
  </div>
</template>

<script>

import axios from 'axios'
import { urlGetInspection } from '../config.js'

export default {
  name: 'negotiator',
  mounted () {

  },
  data () {
    return {

    }
  },
  methods: {
    getInspection() {
      axios.get(urlGetInspection+'/'+this.$router.params.id)
      .then(response => {
        this.inspections = response.data
      }).catch(e => {
        console.log(e)
      })
    }
  },
  components: {
  },
  computed: {
  }
}
</script>
