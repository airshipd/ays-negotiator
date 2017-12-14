<template>

  <section class="section-final--1">

    <div class="row row-finance">
      <div class="col m3">
        <h2 class="title-finance">Finance</h2>
      </div>
      <div class="col m3">
        <choice-group v-if="inspection.finance" v-model="inspection.finance" :name="'finance'" :options="booleanOptions"></choice-group>
      </div>
      <div class="col m4">
        <input-text :label="'If yes, which company?'" v-model="inspection.financeCompany" :name="'financeCompany'"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m4">
        <choice-group v-if="inspection.writeOff" :label="'Write Off'" v-model="inspection.writeOff" :name="'writeOff'" :options="booleanOptions"></choice-group>
      </div>
      <div class="col m4">
        <choice-group v-if="inspection.serviceBooks" :label="'Serivce Books'" v-model="inspection.serviceBooks" :name="'serviceBooks'" :options="booleanOptions"></choice-group>
      </div>
      <div class="col m4">
        <choice-group v-if="inspection.registrationPapers" :label="'Registration Papers'" v-model="inspection.registrationPapers" :name="'registrationPapers'" :options="booleanOptions"></choice-group>
      </div>
    </div>
    <div class="row row-agreedPrice">
      <div class="col">
        Agreed Price: <span>{{inspection.total | currency}}</span>
      </div>
    </div>
    <div class="row row-recievedContract">
      <div class="col m6">
        Has the customer received a copy of this contract?
      </div>
      <div class="col m4">
        <choice-group v-if="inspection.registrationPapers" v-model="inspection.customerReceivedContract" :name="'customerReceivedContract'" :options="booleanOptions"></choice-group>
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
import b2Button from './buttons/B2_buttonNextStep.vue'

import cloneDeep from 'clone-deep'

export default {
  name: 'final-3',
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
      inspection: cloneDeep(this.$store.state.inspection),
      booleanOptions: [
        {value:'0',label:'No'},
        {value:'1',label:'Yes'}
      ]
    }
  },
  methods: {
    actionNext () {
      this.$store.commit('updateInspection',this.inspection)
      this.$router.push('/final/4/'+this.$route.params.id)
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
