<template>
    <section class="section-inspection">

        <div class="row">
            <div class="col m3">
                <input-text :label="'Make'" v-model="inspection.make" :name="'make'" :validation-rules="{required:true}"></input-text>
            </div>
            <div class="col m3">
                <input-text :label="'Model'" v-model="inspection.model" :name="'model'" :validation-rules="{required:true}"></input-text>
            </div>
            <div class="col m3">
                <input-text :label="'Year'" v-model="inspection.year" :name="'year'" :validation-rules="{required:true}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m3">
                <input-text :label="'Odometer'" v-model="inspection.odometer" :validationRules="{required:true,numeric:true}" :name="'odometer'"></input-text>
            </div>
            <div class="col m3">
                <input-select v-if="options.colour" :label="'Colour'" v-model="inspection.colour" :options="options.colour.settings.options"></input-select>
            </div>
            <div class="col m3">
                <input-text :label="'Body'" v-model="inspection.carBody" :name="'body'" :validationRules="{required:true}"></input-text>
            </div>
            <div class="col m3">
                <choice-group v-if="options.driveTrain" :label="'Drive Type'" v-model="inspection.driveTrain" :options="options.driveTrain.settings.options"
                    :name="'driveType'" :validationRules="{required:true}"></choice-group>
            </div>
        </div>

        <div class="row">
            <div class="col m5">
                <choice-group :label="'Doors'" v-model="inspection.doors" :options="custom_options.doors"
                    :name="'doors'" :validationRules="{required:true}"></choice-group>
            </div>
            <div class="col m7 choice-group-seats">
                <choice-group :label="'Seats'" v-model="inspection.seats"
                    :options="[{value:'2',label:2},{value:'4',label:4},{value:'5',label:5},{value:'6',label:6},{value:'7',label:7},{value:'8',label:8}]"
                    :name="'seats'" :validationRules="{required: !inspection.seats || inspection.seats * 1 < 9}"></choice-group>

                <div class="seats-extra">
                    <label v-show="!inspection.seats || inspection.seats < 9" @click="extraSeats">&ge; 9</label>
                    <input type="number" min="9" ref="seats" v-model.lazy.number="inspection.seats" v-if="inspection.seats * 1 >= 9">
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col m3">
                <input-text :label="'Series'" v-model="inspection.series" :name="'series'" :validationRules="{required:true}"></input-text>
            </div>
            <div class="col m3">
                <input-text :label="'Badge'" v-model="inspection.badge" :name="'badge'" :validationRules="{required:true}"></input-text>
            </div>
            <div class="col m3">
                <input-text :label="'Engine'" v-model="inspection.engineSize" :name="'engineSize'" :validationRules="{required:true}"></input-text>
            </div>
            <div class="col m3">
        <input-select v-if="options.engineType" :label="'Engine Type'" v-model="inspection.engineType" :options="options.engineType.settings.options"></input-select>
            </div>
        </div>

        <div class="row">
            <div class="col m3">
        <input-select v-if="options.transmission" :label="'Transmission'" v-model="inspection.transmission" :options="options.transmission.settings.options"></input-select>
            </div>
            <div class="col m3">
                <choice-group v-if="options.wheels" :label="'Wheels'" v-model="inspection.wheels" :options="options.wheels.settings.options"
                    :name="'wheels'" :validationRules="{required:true}"></choice-group>
            </div>
            <div class="col m3">
                <choice-group v-if="options.takataAirbagRecall" :label="'Takata Airbag Recall'" v-model="inspection.takataAirbagRecall"
                    :options="options.takataAirbagRecall.settings.options" :name="'takataAirbagRecall'" :validationRules="{required:true}"></choice-group>
            </div>
            <div class="col m3" v-show="inspection.takataAirbagRecall === 'yes'">
                <choice-group v-if="options.takataAirbagRecallStatus" label="If Yes" v-model="inspection.takataAirbagRecallStatus"
                    :options="options.takataAirbagRecallStatus.settings.options" name="takataAirbagRecallStatus"
                    :validationRules="{required: inspection.takataAirbagRecall === 'yes'}"></choice-group>
            </div>
        </div>

        <div class="row">
            <div class="col m2">
                <input-checkbox :label="'Owner\'s Manual'" v-model="inspection.ownersManual" :model-value="inspection.ownersManual"></input-checkbox>
            </div>
            <div class="col m2">
                <input-checkbox :label="'Sun Roof'" v-model="inspection.sunroof" :model-value="inspection.sunroof"></input-checkbox>
            </div>
            <div class="col m2">
                <input-checkbox :label="'Sat Nav'" v-model="inspection.satNav" :model-value="inspection.satNav"></input-checkbox>
            </div>
            <div class="col m2">
                <input-checkbox :label="'Spare Key'" v-model="inspection.spareKey" :model-value="inspection.spareKey"></input-checkbox>
            </div>
            <div class="col m2">
                <input-checkbox :label="'Leather'" v-model="inspection.leatherUpholstery" :model-value="inspection.leatherUpholstery"></input-checkbox>
            </div>
        </div>

        <div class="row">
            <div class="col m3">
                <choice-group v-if="options.serviceHistory" :label="'Service History'" v-model="inspection.serviceHistory"
                    :options="options.serviceHistory.settings.options" :name="'serviceHistory'" :validationRules="{required:true}"></choice-group>
            </div>
            <div class="col m3">
                <choice-group v-if="['yes', 'partial'].indexOf(inspection.serviceHistory) !== -1" label="" v-model="inspection.serviceHistoryFactory"
                    :options="custom_options.serviceHistoryFactory" name="serviceHistoryFactory" :validationRules="{required: true}"></choice-group>
            </div>
            <div class="col m6" v-if="inspection.serviceHistory === 'partial'">
                <input-range v-model="inspection.serviceHistoryPartial" :min="0" :max="100" :step="10"></input-range>
                <table class="input-range-values">
                    <tr>
                        <td>0%</td>
                        <td>10%</td>
                        <td>20%</td>
                        <td>30%</td>
                        <td>40%</td>
                        <td>50%</td>
                        <td>60%</td>
                        <td>70%</td>
                        <td>80%</td>
                        <td>90%</td>
                        <td>100%</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="row">
            <div class="col m3">
                <input-text :label="'Chassis/Vin No'" v-model="inspection.chassisVinNumber" :name="'chassisVinNumber'"
                    :validation-rules="{required:true, min: 17, max: 17}"></input-text>
            </div>
            <div class="col m3">
                <input-text :label="'Engine Number'" v-model="inspection.engineNumber" :name="'engineNumber'" :validation-rules="{required:true}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m3">
                <input-text label="Registration Number" v-model="inspection.registrationNumber" name="registrationNumber" :validation-rules="{required:true}"></input-text>
            </div>
            <div class="col m3">
                <choice-group label="Personalised Number plates?" v-model="inspection.personalisedNumberPlates"
                    :options="custom_options.yesNo" name="personalisedNumberPlates" :validationRules="{required:true}"></choice-group>
            </div>
            <div class="col m3" v-if="inspection.personalisedNumberPlates == 1">
                <choice-group label="Do you want to keep them?" v-model="inspection.keepNumberPlates"
                    :options="custom_options.yesNo" name="keepNumberPlates" :validationRules="{required:true}"></choice-group>
            </div>
        </div>

        <div class="row">
            <div class="col m3">
                <input-text :label="'Exp Date'" v-model="inspection.expirationDate" :name="'expirationDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
            </div>
            <div class="col m3">
                <input-text :label="'Build Date'" v-model="buildDate" :name="'buildDate'" :validation-rules="{required:true, regex: /^[01]\d\/\d\d$/}"></input-text>
            </div>
            <div class="col m3">
                <input-text :label="'Compliance Date'" v-model="complianceDate" :name="'complianceDate'"
                    :validation-rules="{required:true, regex: /^[01]\d\/\d\d$/}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m4">
                <choice-group v-if="options.overallRating" label="Overall Rating" v-model="inspection.overallRating" :options="options.overallRating.settings.options"
                    name="overallRating" :validationRules="{required:true}"></choice-group>
            </div>
        </div>

        <div class="row">
            <div class="col m12">
                <input-checkbox-switch :label="'Tradesmen Extras'" v-model="inspection.tradesmanExtras" :model-value="inspection.tradesmanExtras"></input-checkbox-switch>
                <input-textarea v-if="inspection.tradesmanExtras === '1'" :name="'tradesmanExtrasDescription'" v-model="inspection.tradesmanExtrasDescription"></input-textarea>
            </div>
        </div>

        <div class="row">
            <div class="col m12">
                <input-checkbox-switch :label="'Upgrades / Mods'" v-model="inspection.upgradesMods" :model-value="inspection.upgradesMods"></input-checkbox-switch>
                <input-textarea v-if="inspection.upgradesMods === '1'" :name="'upgradesAndModsDescription'" v-model="inspection.upgradesAndModsDescription"></input-textarea>
            </div>
        </div>

        <div class="row">
            <div class="col m12">
                <input-checkbox-switch :label="'Sports Kit'" v-model="inspection.sportsKit" :model-value="inspection.sportsKit"></input-checkbox-switch>
                <input-textarea v-if="inspection.sportsKit === '1'" :name="'sportsKitDescription'" v-model="inspection.sportsKitDescription"></input-textarea>
            </div>
        </div>

        <input-file-list :label="'Vehicle Photos'" @updated="addVehiclePhoto" @delete="deleteVehiclePhoto" :initial-images="inspection.vehiclePhotos"></input-file-list>
        <input-file-list :label="'License and Registration Photos'" @updated="addLicenseAndRegistrationPhotos" @delete="deleteLicencePhoto" :initial-images="inspection.licenseAndRegistrationPhotos"></input-file-list>

        <div class="inspection-dark">
            <div class="row">
                <div class="col m7">
                    <input-textarea :label="'Damage & Faults'" :name="'damageAndFaults'" v-model="inspection.damageAndFaults"></input-textarea>
                </div>
                <div class="col m5 total-expenditure">
                    <div></div>
                    <input-text :label="'Total Approx Expenditure'" :name="'approximateExpenditure'" v-model="inspection.approximateExpenditure" :validationRules="{required:true,numeric:true}"></input-text>
                </div>
            </div>
        </div>

        <b1-button :label="'Submit'" :action="submitForm" :fullWidth="true"></b1-button>
        <b1-button class="grey lighten-1" :label="'Skip to Paperwork'" :action="skip" :fullWidth="true"></b1-button>
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
import inputRange from './inputs/N10_Range.vue'

import PostService from '../services/PostService.js'
import GetService from '../services/GetService.js'
import ImageUploader from '../services/ImageUploader'
import moment from 'moment'

export default {
    name: 'negotiator',
    provideValidator: true,
    inject: ['$validator'],
    mounted() {
        this.getInspection();
        this.getOptions();

        this.$store.subscribe(mutation => {
            if(mutation.type === 'reschedule') {
                this.reschedule();
            }
        })

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
            original_inspection: {},
            options: {},
            custom_options: {
                doors: [{value:'2',label:2},{value:'3',label:3},{value:'4',label:4},{value:'5',label:5},{value:'6',label:6}],
                serviceHistoryFactory: [{value: '1', label: 'Factory'}, {value: '0', label: 'Non Factory'}],
                yesNo: [{value: '1', label: 'Yes'}, {value: '0', label: 'No'}],
            },
            buildDate: '',
            complianceDate: '',
        }
    },
    methods: {
        getInspection() {
            GetService.getInspection(this.$route.params.id)
                .then(res => {
                    this.inspection = res.inspection
                    this.original_inspection = Object.assign({}, res.inspection); //cloning
                    this.$store.commit('updateInspection', res.inspection)

                    if(this.inspection.buildDate) {
                        this.buildDate = moment(this.inspection.buildDate, 'DD/MM/YYYY').format('MM/YY');
                    }
                    if(this.inspection.complianceDate) {
                        this.complianceDate = moment(this.inspection.complianceDate, 'DD/MM/YYYY').format('MM/YY');
                    }
                })
        },
        getOptions() {
            GetService.getOptions().then(options => {
                this.options = options
                this.$store.commit('updateOptions', options)
            })
        },
        addVehiclePhoto(file) {
            let that = this;

            new ImageUploader({
                quality: 0.9,
                maxWidth: 1920,
                maxHeight: 1920,
            }).scaleFile(file, function(blob) {
                blob.name = file.name;

                if (!that.inspection.vehiclePhotos) {
                    that.inspection.vehiclePhotos = [blob]
                } else {
                    that.inspection.vehiclePhotos.push(blob)
                }
            });
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
        deleteVehiclePhoto(index) {
            this.inspection.vehiclePhotos.splice(index, 1);
        },
        deleteLicencePhoto(index) {
            this.inspection.licenseAndRegistrationPhotos.splice(index, 1);
        },
        skip() {
          this.$validator.validateAll().then((result) => {
              if (result) {
                  PostService.postMulti(this.$route.params.id, this.inspection, this.options)
                      .then(response => {
                          this.$store.commit('updateInspection', this.inspection)
                          this.$router.push('/final/1/' + this.$route.params.id)
                      }).catch(e => {
                      console.error(e)
                  })
              } else {
                  //scroll up to top of page
                  $(window).scrollTop(0)
              }
          })
        },
        submitForm() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    //turn "MM/YY" into "01-MM-20YY"
                    this.inspection.buildDate = '01/' + this.buildDate.replace('/', '/20');
                    this.inspection.complianceDate = '01/' + this.complianceDate.replace('/', '/20');

                    this.inspection.inspectionStatus = 'Submitted';

                    PostService.postMulti(this.$route.params.id, this.inspection, this.options)
                        .then(response => {
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
        reschedule() {
            this.original_inspection.rescheduled = 1;
            PostService.post(this.$route.params.id, this.original_inspection, this.options)
                .then(response => {
                    this.$store.commit('updateInspection', this.original_inspection)
                    this.$router.push('/')
                }).catch(e => {
                    console.error(e)
                })
        },
        extraSeats() {
            this.inspection.seats = 9;
            this.$nextTick(() => {
                this.$refs.seats.focus();
            });
        }
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
        inputFileList,
        inputRange
    }
}
</script>
