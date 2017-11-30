<template>
  <div id="app" class="inspections">
    <div class="row">
      <div class="col list">
        <ul>
          <list v-for="item in inspections" :inspection="item" :key="item.id"></list>
        </ul>
      </div>
      <div class="col map">

      </div>
    </div>
  </div>
</template>

<script>

import list from './components/listItem.vue'
import axios from 'axios'

import { urlGetInspections } from './config.js'

export default {
  name: 'negotiator',
  mounted () {
    this.getInspections()
  },
  data () {
    return {
      inspections: []
    }
  },
  methods: {
    getInspections () {
      axios.get(urlGetInspections)
      .then(response => {
        this.inspections = response.data
      }).catch(e => {
        console.log(e)
      })
    }
  },
  components: {
    list
	}
}
</script>
