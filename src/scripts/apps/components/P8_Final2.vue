<template>

  <section class="section-final--2">

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
        <input-text :label="'Odometer'" v-model="inspection.odometer" :name="'odometer'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-select v-if="options.colour" :label="'Colour'" v-model="inspection.colour" :options="options.colour.settings.options"></input-select>
      </div>
      <div class="col m3">
        <input-text :label="'Body'" v-model="inspection.carBody" :name="'body'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <choice-group v-if="options.driveTrain" :label="'Drive Type'" v-model="inspection.driveTrain" :options="options.driveTrain.settings.options"
            :name="'driveType'" :validationRules="{required:true}"></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <choice-group :label="'Doors'" v-model="inspection.doors" :options="[{value:'2',label:2},{value:'4',label:4},{value:'6',label:6}]"
            :name="'doors'" :validationRules="{required:true}"></choice-group>
      </div>
      <div class="col m7">
        <choice-group :label="'Seats'" v-model="inspection.seats"
            :options="[{value:'2',label:2},{value:'4',label:4},{value:'5',label:5},{value:'6',label:6},{value:'7',label:7},{value:'8',label:8}]"
            :name="'seats'" :validationRules="{required:true}"></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <input-text :label="'Series'" v-model="inspection.series" :name="'series'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Badge'" v-model="inspection.badge" :name="'badge'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Engine'" v-model="inspection.engineSize" :name="'engine'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-select v-if="options.engineType" :label="'Engine Type'" v-model="inspection.engineType" :options="options.engineType.settings.options"></input-select>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <input-select v-if="options.transmission" :label="'Transmission'" v-model="inspection.transmission" :options="options.transmission.settings.options"></input-select>
      </div>
      <div class="col m5">
        <choice-group v-if="options.wheels" :label="'Wheels'" v-model="inspection.wheels" :options="options.wheels.settings.options"
            :name="'wheels'" :validationRules="{required:true}"></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m2">
        <input-checkbox :label="'Service Book'" v-model="inspection.servicePapers" :model-value="inspection.servicePapers" ></input-checkbox>
      </div>
      <div class="col m2">
         <input-checkbox :label="'Sun Roof'" v-model="inspection.sunroof" :model-value="inspection.sunroof" ></input-checkbox>
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
        <input-text :label="'Chassis/Vin No'" v-model="inspection.chassisVinNumber" :name="'chassisVinNumber'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Engine Number'" v-model="inspection.engineNumber" :name="'engineNumber'" :validation-rules="{required:true}"></input-text>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <input-text :label="'Registration Number'" v-model="inspection.registrationNumber" :name="'registrationNumber'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Exp Date'" v-model="inspection.expirationDate" :name="'registrationExpirationDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Build Date'" v-model="inspection.buildDate" :name="'buildDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Compliance Date'" v-model="inspection.complianceDate" :name="'complianceDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
    </div>

    <input-file-list :label="'Vehicle Photos'" v-on:updated="addVehiclePhoto" :initial-images="inspection.vehiclePhotos"></input-file-list>
    <input-file-list :label="'License and Registration Photos'" v-on:updated="addLicenseAndRegistrationPhotos" :initial-images="inspection.licenseAndRegistrationPhotos"></input-file-list>

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
import inputFileList from './inputs/N8_PhotoList.vue'
import b2Button from './buttons/B2_buttonNextStep.vue'
import ImageUploader from '../services/ImageUploader'

import cloneDeep from 'clone-deep'

export default {
  name: 'final-2',
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
      options: cloneDeep(this.$store.state.options),
    }
  },
  methods: {
    actionNext () {
      this.$validator.validateAll().then((result) => {
        if(result) {
          this.$store.commit('updateInspection',this.inspection)
          this.$router.push('/final/3/'+this.$route.params.id)
        } else {
          //scroll up to top of page
          $(window).scrollTop(0)
        }
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
          }).scaleFile(file, function (blob) {
              blob.name = file.name;

              if (!that.inspection.licenseAndRegistrationPhotos) {
                  that.inspection.licenseAndRegistrationPhotos = [blob]
              } else {
                  that.inspection.licenseAndRegistrationPhotos.push(blob)
              }
          });
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
    inputFileList
  }
}
</script>
