<template>
  <section class="section-inspection">

    <div class="row">
      <div class="col m3">
        <input-text :label="'Odometer'" v-model="inspection.odometer" :validationRules="{required:true,numeric:true}" :name="'odometer'"></input-text>
      </div>
      <div class="col m3">
        <input-select v-if="inspection.colour" :label="'Colour'" v-model="inspection.colour" :options="options.colour.settings.options"></input-select>
      </div>
      <div class="col m3">
        <input-text :label="'Body'" v-model="inspection.carBody" :name="'body'" :validationRules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <choice-group v-if="inspection.driveTrain" :label="'Drive Type'" v-model="inspection.driveTrain" :options="options.driveTrain.settings.options" :name="'driveType'" ></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <choice-group v-if="inspection.doors" :label="'Doors'" v-model="inspection.doors" :options="[{value:'2',label:2},{value:'4',label:4},{value:'6',label:6}]" :name="'doors'" ></choice-group>
      </div>
      <div class="col m7">
        <choice-group v-if="inspection.seats" :label="'Seats'" v-model="inspection.seats"
            :options="[{value:'2',label:2},{value:'4',label:4},{value:'5',label:5},{value:'6',label:6},{value:'7',label:7},{value:'8',label:8}]" :name="'seats'"></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <input-text :label="'Series'" v-model="inspection.series" :name="'series'" :validationRules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Badge'" v-model="inspection.badge" :name="'badge'" :validationRules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Engine'" v-model="inspection.engineSize" :name="'engineSize'" :validationRules="{required:true}"></input-text>
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
        <input-checkbox :label="'Service Book'" v-model="inspection.ownersManual" :model-value="inspection.ownersManual" ></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Sun Roof'" v-model="inspection.sunroof" :model-value="inspection.sunroof" ></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Sat Nav'" v-model="inspection.satNav" :model-value="inspection.satNav"></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Spare Key'" v-model="inspection.spareKey" :model-value="inspection.spareKey"></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Leather'" v-model="inspection.leatherUpholstery" :model-value="inspection.leatherUpholstery"></input-checkbox>
      </div>
    </div>

    <div class="row">
      <div class="col m12">
        <input-checkbox-switch :label="'Tradesmen Extras'" v-model="inspection.tradesmanExtras" :model-value="inspection.tradesmanExtras"></input-checkbox-switch>
        <input-textarea v-if="inspection.tradesmanExtras === '1'" :name="'tradesmanExtrasDescription'" v-model="inspection.tradesmanExtrasDescription" ></input-textarea>
      </div>
    </div>

    <div class="row">
      <div class="col m12">
        <input-checkbox-switch :label="'Upgrades / Mods'" v-model="inspection.upgradesMods" :model-value="inspection.upgradesMods"></input-checkbox-switch>
        <input-textarea v-if="inspection.upgradesMods === '1'" :name="'upgradesAndModsDescription'" v-model="inspection.upgradesAndModsDescription" ></input-textarea>
      </div>
    </div>

    <div class="row">
      <div class="col m12">
        <input-checkbox-switch :label="'Sports Kit'" v-model="inspection.sportsKit" :model-value="inspection.sportsKit"></input-checkbox-switch>
        <input-textarea v-if="inspection.sportsKit === '1'" :name="'sportsKitDescription'" v-model="inspection.sportsKitDescription" ></input-textarea>
      </div>
    </div>

    <div class="inspection-dark">
      <div class="row">
        <div class="col m7">
          <input-textarea :label="'Damage & Faults'" :name="'damageAndFaults'" v-model="inspection.damageAndFaults" ></input-textarea>
        </div>
        <div class="col m5 total-expenditure">
          <div></div>
          <input-text :label="'Total Approx Expenditure'" :name="'approximateExpenditure'" v-model="inspection.approximateExpenditure" :validationRules="{required:true,numeric:true}"></input-text>
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

import PostService from '../services/PostService.js'
import GetService from '../services/GetService.js'

import axios from 'axios'
import moment from 'moment'
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
      options: {}
    }
  },
  methods: {
    getInspection () {
      GetService.getInspection(this.$route.params.id)
      .then(res => {
        console.log('inspection data',res);
        this.inspection = res.inspection
        this.options = res.options
        this.$store.commit('updateInspection',res.inspection)
        this.$store.commit('updateOptions',res.options)
      }).catch(e=> {
        console.error(e)
      })
    },
    submitForm () {
      this.$validator.validateAll().then((result) => {
        if(result) {
          PostService.post(this.$route.params.id,this.inspection,this.options)
          .then(response => {
            console.log(response)
            this.$store.commit('updateInspection',this.inspection)
            this.$router.push('/waiting/'+this.$route.params.id)
          }).catch(e => {
            console.error(e)
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
