<template>
    <section class="section-inspection">
        <div class="row">
            <div class="col m6">
                <input-text :label="'Name'" v-model="inspection.customerName" :name="'customerName'" :validation-rules="{required:true}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m6">
                <input-text :label="'Address'" v-model="inspection.customerAddress" :name="'customerAddress'" :validationRules="{required:true}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m6">
                <input-text :label="'Contact'" v-model="inspection.customerMobileNumber" :name="'customerMobileNumber'" :validationRules="{required:true,numeric:true}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m6">
                <div class="input-field">
                    <datepicker class="input-text" v-model="inspectionDate" format="dd/MM/yyyy" :disabled="disabledDates" :required="true"></datepicker>
                    <label>Inspection</label>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col m6">
                <div class="input-field">
                    <select class="input-select" v-model="mechanicId" id="inspector-select" v-validate="{required: true}">
                        <option value="">Inspector...</option>
                        <option v-for="mechanic in mechanics" :value="mechanic.id">{{ mechanic.firstName }} {{ mechanic.lastName }}</option>
                    </select>
                    <label for="inspector-select">Inspector</label>
                </div>
            </div>
        </div>

        <b1-button :label="'Submit'" :action="submitForm" :fullWidth="true"></b1-button>
        <b1-button class="grey lighten-1" :label="'Skip to Paperwork'" :action="skip" :fullWidth="true"></b1-button>
    </section>
</template>

<script>
import inputText from './inputs/N1_Text.vue'
import b1Button from './buttons/B1_button.vue'
import PostService from '../services/PostService.js'
import GetService from '../services/GetService.js'
import Datepicker from 'vuejs-datepicker'
import moment from 'moment'

import axios from 'axios'
import { urlGetMechanics } from '../config.js'

export default {
    name: 'negotiator',
    provideValidator: true,
    inject: ['$validator'],
    mounted() {
        this.getInspection();
        this.getMechanics();
    },
    data() {
        return {
            inspection: {},
            options: {},
            mechanics: [],
            mechanicId: null,
            inspectionDate: new Date(),
            disabledDates: {
                to: moment().subtract(1, 'd').toDate()
            }
        }
    },
    methods: {
        getInspection() {
            GetService.getInspection(this.$route.params.id)
                .then(res => {
                    this.inspection = res.inspection;
                    this.options = res.options;
                    this.$store.commit('updateInspection', res.inspection);
                    this.$store.commit('updateOptions', res.options);

                    this.mechanicId = this.inspection.mechanic ? this.inspection.mechanic[0] : null
                }).catch(e => {
                    console.error(e)
                })
        },
        getMechanics() {
            let that = this;
            axios.get(urlGetMechanics)
                .then(response => {
                    that.mechanics = response.data;
                }).catch(e => {
                    console.log('Failed getting mechanics: ', e);
                });
        },
        submitForm() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    this.inspection.inspectionDate = moment(this.inspectionDate).format('DD/MM/YYYY');
                    PostService.post(this.$route.params.id, this.inspection, this.options)
                        .then(response => {
                            console.log(response);
                            this.$store.commit('updateInspection', this.inspection);
                            this.$router.push('/pending');
                        }).catch(e => {
                            console.error(e)
                        })
                } else {
                    //scroll up to top of page
                    $(window).scrollTop(0);
                }
            })
        }
    },
    watch: {
        mechanicId: function (id) {
            this.inspection.mechanic = id ? [id] : [];
        }
    },
    components: {
        inputText,
        b1Button,
        Datepicker
    }
}
</script>
