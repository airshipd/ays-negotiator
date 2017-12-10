<template>

  <section class="section-final--1">

    <div class="row">
      <div class="col m12">
        <input-text :label="'Name'" v-model="inspection.customerName"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'Mobile Number'" v-model="inspection.customerMobileNumber"></input-text>
      </div>
      <div class="col m6">
        <input-text :label="'Email'" v-model="inspection.customerEmail"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m8">
        <input-text :label="'Address'" v-model="inspection.customerAddress"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'State'" v-model="inspection.customerState"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m4">
        <input-text :label="'Custmer Suburb'" v-model="inspection.customerSuburb"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Custmer Suburb'" v-model="inspection.customerPostcode"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m5">
        <input-text :label="'Drivers License'" v-model="inspection.customerDriversLicense"></input-text>
      </div>
      <div class="col m2">
        <input-text :label="'Expired'" v-model="inspection.customerDriversLicenseExpirationDate"></input-text>
      </div>
      <div class="col m2">
        <input-text :label="'D/O/B'" v-model="inspection.customerDob"></input-text>
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
      inspection: this.$store.state.inspection
    }
  },
  methods: {
    actionNext () {
      this.$store.commit('updateInspection',this.inspection)
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
