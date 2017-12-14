<template>

  <section class="section-final--1">

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
        <input-select v-if="inspection.colour" :label="'Colour'" v-model="inspection.colour" :options="options.colour.settings.options"></input-select>
      </div>
      <div class="col m3">
        <input-text :label="'Body'" v-model="inspection.body" :name="'body'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <choice-group v-if="inspection.driveTrain" :label="'Drive Type'" v-model="inspection.driveTrain" :options="options.driveTrain.settings.options" :name="'driveType'" ></choice-group>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <choice-group v-if="inspection.doors" :label="'Doors'" v-model="inspection.doors" :options="[{value:'2',label:2},{value:'4',label:4},{value:'6',label:6}]" :name="'doors'" ></choice-group>
      </div>
      <div class="col m7">
        <choice-group v-if="inspection.seats" :label="'Seats'" v-model="inspection.seats" :options="[{value:'2',label:2},{value:'4',label:4},{value:'6',label:6},{value:'7',label:7},{value:'8',label:8}]" :name="'seats'" ></choice-group>
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
        <input-text :label="'Engine'" v-model="inspection.engine" :name="'engine'" :validation-rules="{required:true}"></input-text>
      </div>
      <div class="col m3">
        <input-select v-if="inspection.engineType" :label="'Engine Type'" v-model="inspection.engineType" :options="options.engineType.settings.options"></input-select>
      </div>
    </div>

    <div class="row">
      <div class="col m3">
        <input-select v-if="inspection.transmission" :label="'Transmission'" v-model="inspection.transmission" :options="options.transmission.settings.options"></input-select>
      </div>
      <div class="col m5">
        <choice-group v-if="inspection.wheels" :label="'Wheels'" v-model="inspection.wheels" :options="options.wheels.settings.options" :name="'wheels'" ></choice-group>
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
        <input-text :label="'Exp Date'" v-model="inspection.registrationExpirationDate" :name="'registrationExpirationDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Build Date'" v-model="inspection.buildDate" :name="'buildDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
      <div class="col m3">
        <input-text :label="'Complience Date'" v-model="inspection.complianceDate" :name="'complianceDate'" :validation-rules="{required:true,date_format:'DD/MM/YYYY'}"></input-text>
      </div>
    </div>

    <input-file-list :label="'Vehicle Photos'" v-on:updated="addVehiclePhoto"></input-file-list>
    <input-file-list :label="'License and Registration Photos'" v-on:updated="addLicenseAndRegistrationPhotos"></input-file-list>

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

export default {
  name: 'final-2',
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
      options: Object.assign({},this.$store.state.options),
    }
  },
  methods: {
    actionNext () {
      this.$store.commit('updateInspection',this.inspection)
      this.$router.push('/final/3/'+this.$route.params.id)
    },
    addVehiclePhoto (file) {
      if( ! this.inspection.vehiclePhotos ) {
        this.inspection.vehiclePhotos = [file]
      } else {
        this.inspection.vehiclePhotos.push(file)
      }
    },
    addLicenseAndRegistrationPhotos (file) {
      if( ! this.inspection.licenseAndRegistrationPhotos ) {
        this.inspection.licenseAndRegistrationPhotos = [file]
      } else {
        this.inspection.licenseAndRegistrationPhotos.push(file)
      }
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
  },
  watch: {
    'inspection.vehiclePhotos' (newVal, oldVal) {
      console.log('watching vehicle photos',newVal)
    }
  },
}
</script>
