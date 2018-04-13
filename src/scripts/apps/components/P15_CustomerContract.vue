<template>

  <section class="section-final--5">

      <div class="row">
          <div class="col m4">
              <input-text :label="'Name'" v-model="inspection.customerName" :name="'customerName'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Mobile Number'" v-model="inspection.customerMobileNumber" :name="'customerMobileNumber'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Email'" v-model="inspection.customerEmail" :name="'customerEmail'" :validation-rules="{required:true}"></input-text>
          </div>
      </div>
      <div class="row">
          <div class="col m12">
              <input-address :label="'Customer Address'" v-model="inspection.customerAddress" :name="'customerAddress'" v-validate="{required:true}"></input-address>
          </div>
      </div>
      <div class="row">
          <div class="col m4">
              <input-text :label="'State'" v-model="inspection.customerState" :name="'customerState'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Suburb'" v-model="inspection.customerSuburb" :name="'customerSuburb'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Postcode'" v-model="inspection.customerPostcode" :name="'customerPostcode'" :validation-rules="{required:true}"></input-text>
          </div>
      </div>
      <div class="row">
          <div class="col m8">
              <input-text :label="'Drivers License'" v-model="inspection.customerDriversLicense" :name="'customerDriversLicense'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Expired'" v-model="inspection.customerDriversLicenseExpirationDate" :name="'customerExpirationDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
          </div>
      </div>
      <div class="row">
          <div class="col m4">
              <input-text :label="'D/O/B'" v-model="inspection.customerDob" :name="'customerDOB'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Registration Number'" v-model="inspection.registrationNumber" :name="'registrationNumber'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Exp Date'" v-model="inspection.expirationDate" :name="'registrationExpirationDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
          </div>
      </div>
      <div class="row">
          <div class="col m4">
              <input-checkbox-switch :label="'Finance'" v-model="inspection.finance" :model-value="inspection.finance"></input-checkbox-switch>
          </div>
          <div class="col m8">
              <input-text :label="'If yes, which company?'" v-model="inspection.financeCompany" :name="'financeCompany'"
                  :validationRules="{required: inspection.finance == 1}"></input-text>
          </div>
      </div>
      <div class="row">
          <div class="col m4">
              <input-text :label="'BSB'" v-model="inspection.bsb" :name="'bsb'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Account No'" v-model="inspection.bankAccountNumber" :name="'bankAccountNumber'" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text :label="'Bank'" v-model="inspection.bank" :name="'bank'" :validation-rules="{required:true}"></input-text>
          </div>
      </div>

      <input-file-list :label="'License and Registration Photos'" @updated="addLicenseAndRegistrationPhotos" @delete="deleteLicencePhoto" :initial-images="inspection.licenseAndRegistrationPhotos"></input-file-list>

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
        <input-text :label="'Pickup Address & Contact (if different from above)'" v-model="inspection.pickupAddressAndContact"
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
import inputFileList from './inputs/N8_PhotoList.vue'

import axios from 'axios'
import { urlGetContract, urlSubmitContract, urlSetOpened } from '../config.js'
import GetService from '../services/GetService.js'
import PostService from '../services/PostService.js'
import ImageUploader from '../services/ImageUploader'

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
                    this.options = res.options
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

                    PostService
                        .postMulti(null, this.inspection, this.options, urlSubmitContract + '/' + this.$route.params.id)
                        .then(response => {
                            this.$router.push('/finalized')
                        }).catch(e => {
                            this.buttonDisable = false
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
        addLicenseAndRegistrationPhotos(file) {
            let that = this;

            new ImageUploader({
                quality: 0.9,
                maxWidth: 1920,
                maxHeight: 1920,
            }).scaleFile(file, function(blob) {
                blob.name = file.name;

                if (!that.inspection.licenseAndRegistrationPhotos) {
                    that.inspection.licenseAndRegistrationPhotos = [blob]
                } else {
                    that.inspection.licenseAndRegistrationPhotos.push(blob)
                }
            });
        },
        deleteLicencePhoto(index) {
            this.inspection.licenseAndRegistrationPhotos.splice(index, 1);
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
        inputAddress,
        inputFileList,
    },
    computed: {
        showCustomerSignatureModal() {
            return this.$store.state.overlays.signatureCustomer
        },
    },
}
</script>
