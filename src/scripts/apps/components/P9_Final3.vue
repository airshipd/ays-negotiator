<template>

    <section class="section-final--3">

        <div class="row row-finance">
            <div class="col m12">
                <h2 class="title-finance">Finance</h2>
                <choice-group v-if="inspection.finance" v-model="inspection.finance" :name="'finance'" :options="booleanOptions"
                    :validationRules="{required:true}"></choice-group>
                <input-text :label="'If yes, which company?'" v-model="inspection.financeCompany" :name="'financeCompany'"
                    :validationRules="{required: inspection.finance == 1}"></input-text>
            </div>
        </div>
        <div class="row row-finance--options">
            <div class="col m4">
                <choice-group v-if="inspection.writeOff" :label="'Write Off'" v-model="inspection.writeOff"
                    :name="'writeOff'" :options="booleanOptions" :validationRules="{required:true}"></choice-group>
            </div>
            <div class="col m4">
                <choice-group v-if="inspection.serviceBooks" :label="'Serivce Books'" v-model="inspection.serviceBooks"
                    :name="'serviceBooks'" :options="booleanOptions" :validationRules="{required:true}"></choice-group>
            </div>
            <div class="col m4">
                <choice-group v-if="inspection.registrationPapers" :label="'Registration Papers'" v-model="inspection.registrationPapers"
                    :name="'registrationPapers'" :options="booleanOptions" :validationRules="{required:true}"></choice-group>
            </div>
        </div>
        <div class="row row-agreedPrice">
            <div class="col">
                Agreed Price:
                <input-text v-model="inspection.agreedPrice" :name="'agreedPrice'" :validation-rules="{required:true,numeric:true}"></input-text>
            </div>
        </div>
        <div class="row row-recievedContract">
            <div class="col m12">
                Has the customer received a copy of this contract?
                <choice-group v-if="inspection.registrationPapers" v-model="inspection.customerReceivedContract" :name="'customerReceivedContract'"
                    :options="booleanOptions" :validationRules="{required:true}"></choice-group>
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
  beforeRouteEnter (to, from, next) {
    next(vm => {
      if( $.isEmptyObject(vm.$store.state.inspection) ) {
        next('/final/1/'+vm.$route.params.id)
      }
    })
  },
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
      this.$validator.validateAll().then((result) => {
        if(result) {
          this.$store.commit('updateInspection',this.inspection)
          this.$router.push('/final/4/'+this.$route.params.id)
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
    inputNumber
  },
  computed: {
  },
}
</script>
