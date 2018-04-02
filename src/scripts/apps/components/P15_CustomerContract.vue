<template>

  <section class="section-final--5">

    <div class="row">
      <div class="col m4">
        <input-text disabled :label="'Name'" v-model="inspection.customerName" :name="'customerName'"></input-text>
      </div>
      <div class="col m4">
        <input-text disabled :label="'Mobile Number'" v-model="inspection.customerMobileNumber" :name="'customerMobileNumber'"></input-text>
      </div>
      <div class="col m4">
        <input-text disabled :label="'Email'" v-model="inspection.customerEmail" :name="'customerEmail'"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m8">
        <input-address disabled :label="'Customer Address'" v-model="inspection.customerAddress" :name="'customerAddress'"></input-address>
      </div>
      <div class="col m4">
        <input-text disabled :label="'State'" v-model="inspection.customerState" :name="'customerState'"></input-text>
      </div>
    </div>
    <div class="row row-contract">
      <p> Hereby agree to sell my car to Car Buyers Australia Pty Ltd for the amount of: <strong>{{inspection.agreedPrice | currency}}</strong></p>
      <div v-html="contract"></div>
    </div>
      <div class="row">
          <div class="col m9">
              <input-textarea disabled :label="'Notes'" v-model="inspection.contractNote" :name="'contractNote'"></input-textarea>
          </div>
      </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'Customer Name'" v-model="inspection.customerName" :name="'customerName'" :validation-rules="{required:true}"></input-text>
        <signature v-model="inspection.customerSignatureString" v-if="signatureCustomer" @close="closeSignatureCustomer" ></signature>
        <div class="signature-button" @click="openSignatureCustomer" v-if="!inspection.customerSignatureString"></div>
        <div class="img-signature--wrap" v-else @click="openSignatureCustomer">
          <img class="img-signature" :src="inspection.customerSignatureString" />
        </div>
          <span v-show="submitted && !inspection.customerSignatureString" class="help is-danger">Signature is required</span>
      </div>
      <div class="col m6">
        <input-text disabled :label="'AreYouSelling Rep (Witness) Name'" v-model="inspection.repName" :name="'repName'"></input-text>
        <div class="img-signature--wrap">
          <img class="img-signature" :src="inspection.repSignatureString"  />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col m5">
        <input-text disabled :label="'Model'" v-model="inspection.model" :name="'model'"></input-text>
      </div>
      <div class="col m4">
        <input-text disabled :label="'Kilometers'" v-model="inspection.kilometres" :name="'kilometres'"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m9">
        <input-text disabled :label="'Pickup Address & Contact (if different from above)'" v-model="inspection.pickupAddressAndContact"
            :name="'pickupAddressAndContact'"></input-text>
      </div>
      <div class="col m3">
        <input-text disabled :label="'Date'" v-model="inspection.contractDate" :name="'contractDate'"></input-text>
      </div>
    </div>
    <div class="row car-buyers">
      <div class="col">Car Buyers Australia Pty Ltd.</div>
      <div class="col">ABN: 46 159 545 758. </div>
      <div class="col">LMCT 11137</div>
    </div>
    <b1-button ref="submitButton" :action="actionSubmit" :full-width="true" :label="'Submit'" :disabled="buttonDisable"></b1-button>
  </section>

</template>

<script>
import inputText from './inputs/N1_Text.vue'
import choiceGroup from './inputs/N2_ChoiceGroup.vue'
import inputCheckbox from './inputs/N3_CheckboxCustom.vue'
import inputTextarea from './inputs/N4_Textarea.vue'
import inputSelect from './inputs/N5_Select.vue'
import inputCheckboxSwitch from './inputs/N6_CheckboxSwitch.vue'
import inputNumber from './inputs/N7_Number.vue'
import inputAddress from './inputs/N9_Address.vue'
import b1Button from './buttons/B1_button.vue'
import b2Button from './buttons/B2_buttonNextStep.vue'
import signature from './overlays/O2_Signature.vue'

import axios from 'axios'
import { urlGetContract, urlSubmitContract, urlSetOpened } from '../config.js'
import GetService from '../services/GetService.js'

export default {
    name: 'final-5',
    provideValidator: true,
    inject: ['$validator'],
    mounted() {
        this.getInspection()
        this.getContract()
        this.setOpened()
    },
    data() {
        return {
            inspection: {},
            signatureCustomer: false,
            signatureRep: false,
            contract: null,
            buttonDisable: false,
            submitted: false,
        }
    },
    methods: {
        getContract () {
            axios.get(urlGetContract)
                .then(response => {
                    this.contract = response.data.content
                }).catch(e => {
                    console.error(e)
                })
        },
        getInspection () {
            GetService.getInspection(this.$route.params.id)
                .then(res => {
                    if (res.inspection.inspectionStatus !== 'Unopened' && res.inspection.inspectionStatus !== 'Opened') {
                        window.location = '/login';
                    }

                    this.inspection = res.inspection
                    if(!this.inspection.agreedPrice) {
                      this.inspection.agreedPrice = parseFloat(this.inspection.reviewValuation) - parseFloat(this.inspection.approximateExpenditure)
                    }
                }).catch(e=> {
                    console.error(e)
                })
        },
        actionSubmit() {
            this.submitted = true;

            this.$validator.validateAll().then((result) => {
                if (result && this.inspection.customerSignatureString) {
                    this.buttonDisable = true

                    axios.post(urlSubmitContract + '/' + this.$route.params.id, {
                        customerName: this.inspection.customerName,
                        customerSignatureString: this.inspection.customerSignatureString,
                    }).then(response => {
                        this.$router.push('/finalized')
                    }).catch(e => {
                        this.buttonDisable = false
                        console.error(e)
                    })
                }
            })
        },
        setOpened() {
            axios
                .post(urlSetOpened + '/' + this.$route.params.id)
                .catch(e => console.error(e))
        },
        openSignatureCustomer() {
            this.signatureCustomer = true
        },
        closeSignatureCustomer() {
            this.signatureCustomer = false
        },
    },
    components: {
        inputText,
        choiceGroup,
        inputCheckbox,
        inputTextarea,
        inputSelect,
        b2Button,
        b1Button,
        inputCheckboxSwitch,
        inputNumber,
        signature,
        inputAddress
    },
    computed: {
        showCustomerSignatureModal() {
            return this.$store.state.overlays.signatureCustomer
        },
    },
}
</script>
