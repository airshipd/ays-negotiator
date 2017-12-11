<template>

  <section class="section-final--1">

    <div class="row">
      <div class="col m12">
        <input-text :label="'Name'" v-model="inspection.customerName" :name="'customerName'"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'Mobile Number'" v-model="inspection.customerMobileNumber" :name="'customerMobile'"></input-text>
      </div>
      <div class="col m6">
        <input-text :label="'Email'" v-model="inspection.customerEmail" :name="'customerEmail'"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m8">
        <input-text :label="'Address'" v-model="inspection.customerAddress" :name="'customerAddress'"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'State'" v-model="inspection.customerState" :name="'customerState'"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m4">
        <input-text :label="'Custmer Suburb'" v-model="inspection.customerSuburb" :name="'customerSuburb'"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Custmer Suburb'" v-model="inspection.customerPostcode" :name="'customerSuburb'"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m5">
        <input-text :label="'Drivers License'" v-model="inspection.customerDriversLicense" :name="'customerDriversLicense'"></input-text>
      </div>
      <div class="col m2">
        <input-text :label="'Expired'" v-model="inspection.customerDriversLicenseExpirationDate" :name="'customerExpirationDate'"></input-text>
      </div>
      <div class="col m2">
        <input-text :label="'D/O/B'" v-model="inspection.customerDob" :name="'customerDOB'"></input-text>
      </div>
    </div>
    <b2-button :click="actionNext" :label="'Next Step'"></b2-button>
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
import b2Button from './buttons/B2_buttonNextStep.vue'

export default {
  name: 'final-1',
  provideValidator: true,
  inject: ['$validator'],
  // beforeRouteEnter (to, from, next) {
  //   next(vm => {
  //     if( $.isEmptyObject(vm.$store.state.inspection) ) {
  //       next('/inspection/'+vm.$route.params.id)
  //     }
  //   })
  // },
  mounted () {
  },
  data () {
    return {
      inspection: Object.assign({},this.$store.state.inspection)
    }
  },
  methods: {
    actionNext () {
      this.$store.commit('updateInspection',this.inspection)
      this.$router.push('/final/2/'+this.$router.params.id)
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
    inputNumber
  },
  computed: {
  },
}
</script>
