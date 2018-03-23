<template>
    <section class="section-inspection-details">

        <div class="row">
            <div class="col m6">
                <h4>Customer Details</h4>

                <div class="row">
                    <div class="col m6">Name:</div>
                    <div class="col m6">{{ inspection.customerName }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Phone:</div>
                    <div class="col m6">{{ inspection.customerPhoneNumber }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Mobile:</div>
                    <div class="col m6">{{ inspection.customerMobileNumber }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Address:</div>
                    <div class="col m6">{{ inspection.customerAddress }}</div>
                </div>
                <div class="row">
                    <div class="col m6">State, Suburb, Postcode:</div>
                    <div class="col m6">{{ inspection.customerState + ' ' + inspection.customerSuburb + ' ' + inspection.customerPostcode }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Driving Licence Number:</div>
                    <div class="col m6">{{ inspection.customerDriversLicense }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Driving Licence Exp:</div>
                    <div class="col m6">{{ inspection.customerDriversLicenseExpirationDate }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Date of Birth:</div>
                    <div class="col m6">{{ inspection.customerDob }}</div>
                </div>
            </div>
            <div class="col m6">
                <h4>Car Details</h4>

                <div class="row">
                    <div class="col m12">{{ inspection.year + ' ' + inspection.make + ' ' + inspection.model + ' ' + inspection.badge + ' ' + inspection.series }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Body:</div>
                    <div class="col m6">{{ inspection.carBody }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Colour:</div>
                    <div class="col m6">{{ inspection.colour }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Engine Size:</div>
                    <div class="col m6">{{ inspection.engineSize }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Transmission:</div>
                    <div class="col m6">{{ inspection.transmission }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Odometer:</div>
                    <div class="col m6">{{ inspection.odometer }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Seats:</div>
                    <div class="col m6">{{ inspection.seats }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Doors:</div>
                    <div class="col m6">{{ inspection.doors }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Engine Type:</div>
                    <div class="col m6">{{ inspection.engineType }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Drive Train:</div>
                    <div class="col m6">{{ inspection.driveTrain }}</div>
                </div>
                <div class="row">
                    <div class="col m6">VIN:</div>
                    <div class="col m6">{{ inspection.chassisVinNumber }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Engine Number:</div>
                    <div class="col m6">{{ inspection.engineNumber }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Registration Number:</div>
                    <div class="col m6">{{ inspection.registrationNumber }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Registration Expiration Date:</div>
                    <div class="col m6">{{ inspection.registrationExpirationDate }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Build Date:</div>
                    <div class="col m6">{{ inspection.buildDate }}</div>
                </div>
                <div class="row">
                    <div class="col m6">Compliance Date:</div>
                    <div class="col m6">{{ inspection.complianceDate }}</div>
                </div>
            </div>
        </div>

        <div class="row photo-list">
            <h3>Photos</h3>
            <label class="col m3" v-for="img in imgs">
                <a :href="img.url" target="_blank">
                    <img :src="img.url" alt="">
                </a>
            </label>
        </div>

        <div class="row">
            <div class="col m12 right-align">
                <h4>Latest Price: $ <input v-model="inspection.reviewValuation" name="reviewValuation" v-validate="{required: true, decimal: 2}"></h4>
                <span v-show="errors.has('reviewValuation')" class="help is-danger">{{ errors.first('reviewValuation') }}</span>
            </div>
            <div class="col m12">
                <textarea v-model="inspection.notes" name="notes" placeholder="Notes..." />
            </div>
        </div>

        <b1-button label="Email Customer Paperwork" :fullWidth="true"></b1-button>
        <b1-button class="grey lighten-1" label="Send for Sales Consultant for follow up" :fullWidth="true"></b1-button>
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
import b1Button from './buttons/B1_button.vue'
import inputFileList from './inputs/N8_PhotoList.vue'

import PostService from '../services/PostService.js'
import GetService from '../services/GetService.js'
import debounce from 'lodash/debounce';

export default {
    name: 'inspectionDetails',
    provideValidator: true,
    inject: ['$validator'],
    mounted() {
        this.getInspection()
    },
    data() {
        return {
            inspection: {},
            imgs: [],
            // original_inspection: {},
            // options: {}
        }
    },
    methods: {
        getInspection() {
            GetService.getInspection(this.$route.params.id)
                .then(res => {
                    this.inspection = res.inspection
                    this.options = res.options
                    this.imgs = (this.inspection.vehiclePhotos || []).concat(this.inspection.licenseAndRegistrationPhotos || []);
                }).catch(e => {
                    console.error(e)
                })
        },
        skip() {
            PostService.submitInspection(this.$route.params.id);
            this.$router.push('/final/1/' + this.$route.params.id)
        },
        submitForm() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    PostService.postMulti(this.$route.params.id, this.inspection, this.options)
                        .then(response => {
                            PostService.submitInspection(this.$route.params.id);
                            this.$store.commit('updateInspection', this.inspection)
                            this.$router.push('/waiting/' + this.$route.params.id)
                        }).catch(e => {
                            console.error(e)
                        })
                } else {
                    //scroll up to top of page
                    $(window).scrollTop(0)
                }
            })
        },
    },
    watch: {
        'inspection.reviewValuation': debounce(function (reviewValuation) {
            if(!this.errors.has('reviewValuation')) {
                PostService
                    .post(this.$route.params.id, {reviewValuation}, this.options)
                    .catch(e => console.error(e))
            }
        }, 300),
        'inspection.notes': debounce(function (notes) {
            PostService
                .post(this.$route.params.id, {notes}, this.options)
                .catch(e => console.error(e))
        }, 300)
    },
    components: {
        inputText,
        choiceGroup,
        inputCheckbox,
        inputTextarea,
        inputSelect,
        b1Button,
        inputCheckboxSwitch,
        inputNumber,
        inputFileList
    }
}
</script>
