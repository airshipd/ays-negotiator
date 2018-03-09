<template>

  <section class="section-final--1">

    <div class="row">
      <div class="col m4">
        <input-text :label="'Name'" v-model="inspection.customerName" :name="'customerName'" :validation-rules="{required:true}"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m4">
        <input-text :label="'Mobile Number'" v-model="inspection.customerMobileNumber" :name="'customerMobile'" :validation-rules="{required:true,numeric:true}"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Email'" v-model="inspection.customerEmail" :name="'customerEmail'" :validation-rules="{required:true,email:true}"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m9">
        <input-address :label="'Address'" v-model="inspection.customerAddress" :name="'customerAddress'" :validation-rules="{required:true}"></input-address>
      </div>
      <div class="col m3">
        <input-text :label="'State'" v-model="inspection.customerState" :name="'customerState'" :validation-rules="{required:true}"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m4">
        <input-text :label="'Customer Suburb'" v-model="inspection.customerSuburb" :name="'customerSuburb'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Customer Postcode'" v-model="inspection.customerPostcode" :name="'customerPostCode'" :validation-rules="{required:true}"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m5">
        <input-text :label="'Drivers License'" v-model="inspection.customerDriversLicense" :name="'customerDriversLicense'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m2">
        <input-text :label="'Expired'" v-model="inspection.customerDriversLicenseExpirationDate" :name="'customerExpirationDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
      <div class="col m2">
        <input-text :label="'D/O/B'" v-model="inspection.customerDob" :name="'customerDOB'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
    </div>
    <b2-button :action="actionNext" :label="'Next Step'"></b2-button>
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
import inputAddress from './inputs/N9_Address.vue'
import b2Button from './buttons/B2_buttonNextStep.vue'

import GetService from '../services/GetService.js'

export default {
  name: 'final-1',
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
        this.inspection = res.inspection
        this.options = res.options
        this.$store.commit('updateInspection',res.inspection)
        this.$store.commit('updateOptions',res.options)
      }).catch(e=> {
        console.error(e)
      })
    },
    actionNext () {
      this.$validator.validateAll().then((result) => {
        if(result) {
          this.$store.commit('updateInspection',this.inspection)
          this.$router.push('/final/2/'+this.$route.params.id)
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
    b2Button,
    inputCheckboxSwitch,
    inputNumber,
    inputAddress,
  },
  computed: {
  },
}
</script>
