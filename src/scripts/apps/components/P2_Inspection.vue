<template>
  <section clas="section-inspection">

    <div class="row">
      <div class="col m3">
        <input-text :label="'Odometer'" v-model="inspection.odometer"></input-text>
      </div>
      <div class="col m3">
        <input-select v-if="inspection.colour" label="'Colour'" v-model="inspection.colour" :options="options.colour.settings.options"></input-select>
      </div>
      <div class="col m3">
        <input-text :label="'Body'" v-model="inspection.carBody"></input-text>
      </div>
      <div class="col m3">
        <choice-group v-if="inspection.driveTrain" :label="'Drive Type'" v-model="inspection.driveTrain" :options="options.driveTrain.settings.options" :name="'driveTrain'" ></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <input-checkbox :label="'Service Book'" v-model="inspection.servicePapers" ></input-checkbox>
      </div>
      <div class="col">
        <input-textarea :label="'Tradesman Extras'" v-model="inspection.tradesmanExtrasDescription" ></input-textarea>
      </div>
    </div>


    <b1-button :label="Submit" :action="submitForm"></b1-button>
  </section>
</template>

<script>
import inputText from './inputs/N1_Text.vue'
import choiceGroup from './inputs/N2_ChoiceGroup.vue'
import inputCheckbox from './inputs/N3_CheckboxCustom.vue'
import inputTextarea from './inputs/N4_Textarea.vue'
import inputSelect from './inputs/N5_Select.vue'
import b1Button from './buttons/B1_button.vue'

import qs from 'qs'

import axios from 'axios'
import { urlGetInspection } from '../config.js'

export default {
  name: 'negotiator',
  mounted () {
    this.getInspection()
  },
  data () {
    return {
      inspection: {},
      options: []
    }
  },
  methods: {
    getInspection() {
      axios.get(urlGetInspection+'/'+this.$route.params.id)
      .then(response => {
        console.log(response.data)
        this.inspection = response.data.data
        this.options = response.data.options
        this.$store.commit('updateInspection', response.data.data)
      }).catch(e => {
        console.log(e)
      })
    },
    submitForm() {
      // lets build out data object
      let sendObj = {
        action: 'entries/saveEntry',
        sectionId: '3',
        entryId: '2003',
        enabled: '1',
      }

      //loop through all field entries and build out
      for (let key in this.inspection) {
        if (this.inspection.hasOwnProperty(key)) {
            sendObj['fields['+key+']'] = this.inspection[key]
        }
      }

      axios.post('/',qs.stringify(sendObj))
      .then(response => {
        console.log(response)
      }).catch(e => {
        console.log(e)
      })
    }
  },
  components: {
    inputText,
    choiceGroup,
    inputCheckbox,
    inputTextarea,
    inputSelect,
    b1Button
  }
}
</script>
