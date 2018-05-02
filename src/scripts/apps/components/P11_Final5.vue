<template>

  <section class="section-final--5">
    <div class="row">
      <div class="col m4">
        <input-text :label="'Name'" v-model="inspection.customerName" :name="'customerName'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Mobile Number'" v-model="inspection.customerMobileNumber" :name="'customerMobileNumber'" :validation-rules="{required:true,numeric:true}"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Email'" v-model="inspection.customerEmail" :name="'customerEmail'" :validation-rules="{required:true,email:true}"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m8">
        <input-address :label="'Customer Address'" v-model="inspection.customerAddress" :name="'customerAddress'" v-validate="{required:true}"></input-address>
      </div>
      <div class="col m4">
        <input-text :label="'State'" v-model="inspection.customerState" :name="'customerState'" :validation-rules="{required:true}"></input-text>
      </div>
    </div>
    <div class="row row-contract">
      <p>I hereby agree to sell my car to Car Buyers Australia Pty Ltd for the amount of: <strong>{{inspection.agreedPrice | currency}}</strong></p>
      <div v-html="contract"></div>
    </div>
    <div class="row">
      <div class="col m6">
        <input-text :label="'Customer Name'" v-model="inspection.customerName" :name="'customerName'" :validation-rules="{required:true}"></input-text>
        <signature v-model="inspection.customerSignatureString" v-if="signatureCustomer" @close="closeSignatureCustomer" ></signature>
        <div class="signature-button" @click="openSignatureCustomer" v-if="!inspection.customerSignatureString"></div>
        <div class="img-signature--wrap" v-else @click="openSignatureCustomer">
          <img class="img-signature" :src="inspection.customerSignatureString" />
        </div>
      </div>
      <div class="col m6">
        <input-text :label="'AreYouSelling Rep (Witness) Name'" v-model="inspection.repName" :name="'repName'" :validation-rules="{required:true}"></input-text>
        <signature v-model="inspection.repSignatureString" v-if="signatureRep" @close="closeSignatureRep"></signature>
        <div class="signature-button" @click="openSignatureRep" v-if="!inspection.repSignatureString"></div>
        <div class="img-signature--wrap" v-else @click="openSignatureRep">
          <img class="img-signature" :src="inspection.repSignatureString"  />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col m5">
        <input-text :label="'Model'" v-model="inspection.model" :name="'model'" :validationRules="{required:true}"></input-text>
      </div>
      <div class="col m4">
        <input-text :label="'Kilometers'" v-model="inspection.odometer" :name="'odometer'" :validationRules="{required:true}"></input-text>
      </div>
    </div>
    <div class="row">
      <div class="col m9">
        <input-text :label="'Pickup Address & Contact (if different from above)'" v-model="inspection.pickupAddressAndContact"
            :name="'pickupAddressAndContact'" :validationRules="{}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Date'" v-model="inspection.contractDate" :name="'contractDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
    </div>

      <div class="row">
          <div class="col m9">
              <input-textarea :label="'Notes'" v-model="inspection.contractNote" :name="'contractNote'" :validationRules="{required:true}"></input-textarea>
          </div>
      </div>
      <div class="row">
          <div class="col m12">
              <choice-group v-if="options.priceType" :validation-rules="{required: true}" v-model="inspection.priceType" name="price_type"
                  :options="options.priceType.settings.options"></choice-group>
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

import PostService from '../services/PostService.js'

import axios from 'axios'
import cloneDeep from 'clone-deep'
import { urlGetContract } from '../config.js'

export default {
    name: 'final-5',
    provideValidator: true,
    inject: ['$validator'],
    beforeRouteEnter(to, from, next) {
        next(vm => {
            if ($.isEmptyObject(vm.$store.state.inspection)) {
                next('/final/1/' + vm.$route.params.id)
            }
        })
    },
    mounted() {
        axios.get(urlGetContract)
            .then(response => {
                this.contract = response.data.content
            }).catch(e => {
                console.error(e)
            })

        this.inspection.repName = this.inspection.repName || this.$store.state.username;
    },
    data() {
        return {
            inspection: cloneDeep(this.$store.state.inspection),
            options: cloneDeep(this.$store.state.options),
            signatureCustomer: false,
            signatureRep: false,
            contract: null,
            buttonDisable: false
        }
    },
    methods: {
        actionSubmit() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    this.buttonDisable = true
                    this.inspection.inspectionStatus = 'finalized' //finalise necessary form data
                    PostService.postMulti(this.$route.params.id === 'new' ? undefined : this.$route.params.id, this.inspection, this.options)
                        .then(response => {
                            this.$store.commit('updateInspection', {})
                            this.$store.commit('updateOptions', {})
                            this.$router.push('/finalized')
                        }).catch(e => {
                            this.buttonDisable = false
                            console.error(e)
                        })
                } else {
                    //scroll up to top of page
                    $(window).scrollTop(0)
                }
            })
        },
        openSignatureCustomer() {
            this.signatureCustomer = true
        },
        openSignatureRep() {
            this.signatureRep = true
        },
        closeSignatureCustomer() {
            this.signatureCustomer = false
        },
        closeSignatureRep() {
            this.signatureRep = false
        }
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
        showRepSignatureModal() {
            return this.$store.state.overlays.signatureRep
        }
    },
}
</script>
