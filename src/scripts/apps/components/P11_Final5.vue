<template>

  <section class="section-final--1">

    <div class="row">
      <div class="col m4">
        <input-text :label="'Name'" v-model="inspection.customerName" :name="'customerName'" :disabled="true"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Mobile Number'" v-model="inspection.customerMobileNumber" :name="'customerMobileNumber'" :disabled="true"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Email'" v-model="inspection.customerEmail" :name="'customerEmail'" :disabled="true"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'Mobile Number'" v-model="inspection.customerAddress" :name="'customerAddress'" :disabled="true"></input-text>
      </div>
      <div class="col m6">
        <input-text :label="'State'" v-model="inspection.customerState" :name="'customerState'" :disabled="true"></input-text>
      </div>
    </div>
    <div class="row">
      Hereby agree to sell my car to Car Buyers Australia Pty Ltd for the amount of: {{inspection.total}}
    </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'Customer Name'" v-model="inspection.customerName" :name="'customerName'" :disabled="true"></input-text>
        <signature v-model="inspection.customerSignatureString" v-if="showSignatureModal"></signature>
        <div class="signature-button" @click="openCustomerSignature"></div>
      </div>
      <div class="col m6">
        <input-text :label="'AreYouSelling Rep (Witness) Name'" v-model="inspection.repName" :name="'repName'"></input-text>
        <div class="signature-button" @click="openRepSignature"></div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <input-text :label="'Model'" v-model="inspection.model" :name="'model'" :disabled="true"></input-text>
      </div>
      <div class="col">
        <input-text :label="'Kilometers'" v-model="inspection.kilometers" :name="'kilometers'" :disabled="true"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <input-text :label="'Pickup Address & Contact (if different from above)'" v-model="inspection.pickupAddressAndContact" :name="'pickupAddressAndContact'"></input-text>
      </div>
      <div class="col">
        <input-text :label="'Date'" v-model="inspection.contractDate" :name="'contractDate'"></input-text>
      </div>
    </div>
    <div class="row car-buyers">
      <div class="col">Car Buyers Australia Pty Ltd.</div>
      <div class="co">ABN: 46 159 545 758. </div>
      <div class="col">LMCT 11137</div>
    </div>
    <b2-button :click="actionSubmit" :label="'Submit'"></b2-button>
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
import signature from './overlays/O2_Signature.vue'

export default {
  name: 'final-5',
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
      inspection: Object.assign({},this.$store.state.inspection),
      signatureCustomer: false,
      signatureRep: false,
    }
  },
  methods: {
    actionSubmit () {
      this.$store.commit('updateInspection',this.inspection)
      this.$router.push('/finalized')
    },
    openCustomerSignature () {
      this.signatureCustomer = true
    },
    openRepSignature () {
      this.signatureRep = true
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
    signature
  },
  computed: {
    showSignatureModal () {
      this.$store.state.overlays.signature
    }
  },
}
</script>
