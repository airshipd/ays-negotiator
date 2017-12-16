<template>

  <section class="section-final--4">

    <div class="row">
      <div class="col m12 bank-details">
        <h2>Bank Details</h2>
        <p>Must be the registered owner of the vehicle unless a letter of authority with additional information supplied</p>
      </div>
    </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'BSB'" v-model="inspection.bsb" :name="'customerMobile'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m6">
        <input-text :label="'Account No'" v-model="inspection.bankAccountNumber" :name="'bankAccountNumber'" :validation-rules="{required:true}"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'Name'" v-model="inspection.customerName" :name="'Name'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m6">
        <input-text :label="'Bank'" v-model="inspection.bank" :name="'bank'" :validation-rules="{required:true}"></input-text>
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
  name: 'final-4',
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
      inspection: cloneDeep(this.$store.state.inspection)
    }
  },
  methods: {
    actionNext () {
      this.$store.commit('updateInspection',this.inspection)
      this.$router.push('/final/5/'+this.$route.params.id)
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
