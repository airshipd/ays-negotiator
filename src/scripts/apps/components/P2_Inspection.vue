<template>
  <section clas="section-inspection--main">

    <div class="row">
      <div class="col">
        <input-text :label="'Odometer'"></input-text>
      </div>
      <div class="col">
        <input-text :label="'Colour'"></input-text>
      </div>
      <div class="col">
        <input-text :label="'Body'"></input-text>
      </div>
      <div class="col">
        <choice-group :label="'Drive Type'"></choice-group>
      </div>
    </div>

  </section>
</template>

<script>
import inputText from './inputs/N1_Text.vue'
import choiceGroup from './inputs/N2_ChoiceGroup.vue'

import axios from 'axios'
import { urlGetInspection } from '../config.js'

export default {
  name: 'negotiator',
  mounted () {

  },
  data () {
    return {
      inspection: {}
    }
  },
  methods: {
    getInspection() {
      axios.get(urlGetInspection+'/'+this.$router.params.id)
      .then(response => {
        this.inspection = response.data
      }).catch(e => {
        console.log(e)
      })
    }
  },
  components: {
    inputText,
    choiceGroup
  },
  computed: {
  }
}
</script>
