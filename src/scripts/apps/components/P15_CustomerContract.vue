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
              <input-text :label="'Exp Date'" v-model="inspection.expirationDate" :name="'expirationDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
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

      <input-file-list label="License and Registration Photos" @updated="addLicenseAndRegistrationPhotos" @delete="deleteLicencePhoto" :initial-images="inspection.licenseAndRegistrationPhotos"></input-file-list>

      <div class="row row-contract">
          <p>I hereby agree to sell my car to Car Buyers Australia Pty Ltd for the amount of: <strong>{{ price | currency }}</strong></p>
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
          <span v-show="submitted && !inspection.customerSignatureString" class="help is-danger">Signature is required</span>
      </div>
      <div class="col m6">
        <input-text disabled label="AreYouSelling Rep (Witness) Name" v-model="inspection.repName" name="repName"></input-text>
        <div class="img-signature--wrap">
          <img class="img-signature" :src="inspection.repSignatureString">
        </div>
      </div>
    </div>

      <div class="row">
          <div class="col m4">
              <input-text disabled label="Model" v-model="inspection.model" name="model"></input-text>
          </div>
          <div class="col m4">
              <input-text label="Body" v-model="inspection.carBody" name="body" :validation-rules="{required:true}"></input-text>
          </div>
          <div class="col m4">
              <input-text label="Kilometers" v-model="inspection.odometer" name="odometer" :validation-rules="{required:true}"></input-text>
          </div>
      </div>

      <div class="row">
          <div class="col m6">
              <input-text label="Chassis/Vin No" v-model="inspection.chassisVinNumber" name="chassisVinNumber" :validation-rules="{required:true, min: 17, max: 17}"></input-text>
          </div>
          <div class="col m6">
              <input-text label="Engine Number" v-model="inspection.engineNumber" name="engineNumber" :validation-rules="{required:true}"></input-text>
          </div>
      </div>

      <div class="row">
          <div class="col m3">
              <input-text label="Build Date" v-model="buildDate" name="buildDate" :validation-rules="{required:true, regex: /^[01]\d\/\d\d$/}"></input-text>
          </div>
          <div class="col m3">
              <input-text label="Compliance Date" v-model="complianceDate" name="complianceDate" :validation-rules="{required:true, regex: /^[01]\d\/\d\d$/}"></input-text>
          </div>
      </div>

    <div class="row">
      <div class="col m9">
        <input-text :label="'Pickup Address & Contact (if different from above)'" v-model="inspection.pickupAddressAndContact"
            :name="'pickupAddressAndContact'"></input-text>
      </div>
      <div class="col m3">
        <input-text disabled label="Date" v-model="inspection.contractDate" name="contractDate"></input-text>
      </div>
    </div>
      <div class="row">
          <div class="col m9">
              <input-textarea disabled label="Notes" v-model="inspection.contractNote" name="contractNote"></input-textarea>
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
import moment from 'moment'

export default {
    name: 'final-5',
    provideValidator: true,
    inject: ['$validator'],
    mounted() {
        this.getInspection()
        this.getContract()
        this.setOpened()

        this.$validator.localize('en', {
            custom: {
                chassisVinNumber: {
                    min: 'Must be exactly 17 characters.',
                    max: 'Must be exactly 17 characters.',
                },
                buildDate: {
                    regex: 'Must have format MM/YY.',
                },
                complianceDate: {
                    regex: 'Must have format MM/YY.',
                }
            }
        });
    },
    data() {
        return {
            inspection: {},
            signatureCustomer: false,
            contract: null,
            buttonDisable: false,
            submitted: false,
            buildDate: '',
            complianceDate: '',
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
                    this.inspection.contractDate = moment().format('DD/MM/YYYY'); //reset contract date to today
                    this.inspection.odometer = this.inspection.odometer || this.inspection.kilometres;
                    if(!this.inspection.repName && !this.inspection.repSignatureString) {
                        this.inspection.repName = 'Nissar Munseea';
                        this.inspection.repSignatureString = 'data:image/png;base64,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';
                    }
                    if(this.inspection.buildDate) {
                        this.buildDate = moment(this.inspection.buildDate, 'DD/MM/YYYY').format('MM/YY');
                    }
                    if(this.inspection.complianceDate) {
                        this.complianceDate = moment(this.inspection.complianceDate, 'DD/MM/YYYY').format('MM/YY');
                    }
                })
        },
        actionSubmit() {
            this.submitted = true;

            this.$validator.validateAll().then((result) => {
                if (result && this.inspection.customerSignatureString) {
                    this.buttonDisable = true

                    //turn "MM/YY" into "01-MM-20YY"
                    this.inspection.buildDate = '01/' + this.buildDate.replace('/', '/20');
                    this.inspection.complianceDate = '01/' + this.complianceDate.replace('/', '/20');

                    PostService
                        .postMulti(null, this.inspection, this.options, urlSubmitContract + '/' + this.$route.params.id)
                        .then(response => {
                            this.$router.push('/offer-finalized')
                        }).catch(e => {
                            this.buttonDisable = false
                        })
                } else {
                    this.scrollToInvalid();
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
                maxWidth: 1280,
                maxHeight: 1280,
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
        price() {
            return parseFloat(this.inspection.agreedPrice) || parseFloat(this.inspection.reviewValuation) - parseFloat(this.inspection.approximateExpenditure);
        }
    },
}
</script>
