<template>
  <section class="section-inspection">

    <div class="row">
      <div class="col m3">
        <input-text :label="'Odometer'" v-model="inspection.odometer" :validationRules="{required:true}" :name="'odometer'"></input-text>
      </div>
      <div class="col m3">
        <input-select v-if="inspection.colour" :label="'Colour'" v-model="inspection.colour" :options="options.colour.settings.options"></input-select>
      </div>
      <div class="col m3">
        <input-text :label="'Body'" v-model="inspection.carBody" :name="'body'"></input-text>
      </div>
      <div class="col m3">
        <choice-group v-if="inspection.driveTrain" :label="'Drive Type'" v-model="inspection.driveTrain" :options="options.driveTrain.settings.options" :name="'choice'" ></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <choice-group v-if="inspection.doors" :label="'Doors'" v-model="inspection.doors" :options="[{value:'2',label:2},{value:'4',label:4},{value:'6',label:6}]" :name="'doors'" ></choice-group>
      </div>
      <div class="col m7">
        <choice-group v-if="inspection.seats" :label="'Seats'" v-model="inspection.seats" :options="[{value:'2',label:2},{value:'4',label:4},{value:'6',label:6},{value:'7',label:7},{value:'8',label:8}]" :name="'seats'" ></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <input-text :label="'Series'" v-model="inspection.series" :name="'series'"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Badge'" v-model="inspection.badge" :name="'badge'"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Engine'" v-model="inspection.engine" :name="'engine'"></input-text>
      </div>
      <div class="col m3">
        <input-select v-if="inspection.engineType" :label="'Engine Type'" v-model="inspection.engineType" :options="options.engineType.settings.options"></input-select>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <input-select v-if="inspection.transmission" :label="'Transmission'" v-model="inspection.transmission" :options="options.transmission.settings.options"></input-select>
      </div>
      <div class="col m5">
        <choice-group v-if="inspection.wheels" :label="'Wheels'" v-model="inspection.wheels" :options="options.wheels.settings.options" :name="'wheels'" ></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m2">
        <input-checkbox :label="'Service Book'" v-model="inspection.servicePapers" ></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Sun Roof'" v-model="inspection.sunroof" ></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Sat Nav'" v-model="inspection.satNav" ></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Spare Key'" v-model="inspection.spareKey" ></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Leather'" v-model="inspection.leatherUpholstery" ></input-checkbox>
      </div>
    </div>

    <div class="row">
      <div class="col m12">
        <input-checkbox-switch :label="'Tradesmen Extras'" v-model="inspection.tradesmanExtras" ></input-checkbox-switch>
        <input-textarea v-if="inspection.tradesmanExtras" v-model="inspection.tradesmanExtrasDescription" ></input-textarea>
      </div>
    </div>

    <div class="row">
      <div class="col m12">
        <input-checkbox-switch :label="'Upgrades / Mods'" v-model="inspection.upgradesMods" ></input-checkbox-switch>
        <input-textarea v-if="inspection.upgradesMods" v-model="inspection.upgradesAndModsDescription" ></input-textarea>
      </div>
    </div>

    <div class="row">
      <div class="col m12">
        <input-checkbox-switch :label="'Sports Kit'" v-model="inspection.sportsKit" ></input-checkbox-switch>
        <input-textarea v-if="inspection.sportsKit" v-model="inspection.sportsKitDescription" ></input-textarea>
      </div>
    </div>

    <div class="inspection-dark">
      <div class="row">
        <div class="col m7">
          <input-textarea :label="'Damage & Faults'" v-model="inspection.sportsKitDescription" ></input-textarea>
        </div>
        <div class="col m5 total-expenditure">
          <div></div>
          <input-number :label="'Total Approx Expenditure'" v-model="inspection.approximateExpenditure"></input-number>
        </div>
      </div>
    </div>

    <b1-button :label="'Submit'" :action="submitForm" :fullWidth="true"></b1-button>
  </section>
</template>

<script>
import inputText from './inputs/N1_Text.vue'
import inputNumber from './inputs/N7_Number.vue'
import choiceGroup from './inputs/N2_ChoiceGroup.vue'
import inputCheckbox from './inputs/N3_CheckboxCustom.vue'
import inputCheckboxSwitch from './inputs/N6_CheckboxSwitch.vue'
import inputTextarea from './inputs/N4_Textarea.vue'
import inputSelect from './inputs/N5_Select.vue'
import b1Button from './buttons/B1_button.vue'

import qs from 'qs'
import moment from 'moment'
import axios from 'axios'
import { urlGetInspection } from '../config.js'

export default {
  name: 'negotiator',
  provideValidator: true,
  inject: ['$validator'],
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
        console.log('inspection data', response.data)
        this.formatData(response.data)
      }).catch(e => {
        console.error(e)
      })
    },
    formatData (res) {
      res.data.buildDate = res.data.buildDate ? moment(res.data.buildDate.date).format('DD/MM/YYYY') : null
      res.data.transmission = res.data.transmission ? res.data.transmission : 'auto'
      res.data.colour = res.data.colour ? res.data.colour : 'silver'
      res.data.engineType = res.data.engineType ? res.data.engineType : 'petrol'
      res.data.seats = res.data.seats === "0" ? "2" : res.data.seats
      res.data.doors = res.data.doors === "0" ? "2" : res.data.doors
      this.inspection = res.data
      this.options = res.options
      this.$store.commit('updateInspection',res.data)
    },
    submitForm () {
      this.$validator.validateAll().then((result) => {
        if(result) {
          // lets build out data object
          let sendObj = {
            action: 'entries/saveEntry',
            sectionId: '3',
            entryId: this.$route.params.id,
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
            this.$store.commit('updateInspection',this.inspection)
            this.$router.push('/waiting/'+this.$route.params.id)
          }).catch(e => {
            console.log(e)
          })
        } else {
          //scroll up to top of page
          $(window).scrollTop(0)
        }
      })
    }
  },
  components: {
    inputText,
    choiceGroup,
    inputCheckbox,
    inputTextarea,
    inputSelect,
    b1Button,
    inputCheckboxSwitch,
    inputNumber
  }
}
</script>
