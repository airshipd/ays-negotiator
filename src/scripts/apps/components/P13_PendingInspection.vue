<template>
    <section class="section-inspection">
        <div class="row">
            <div class="col m6">
                <input-text :label="'Name'" v-model="inspection.customerName" :name="'customerName'" :validation-rules="{required:true}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m6">
                <input-address :label="'Address'" v-model="inspection.customerAddress" :name="'customerAddress'" v-validate="{required:true}"></input-address>
            </div>
        </div>

        <div class="row">
            <div class="col m6">
                <input-text :label="'Contact'" v-model="inspection.customerMobileNumber" :name="'customerMobileNumber'" :validationRules="{required:true,numeric:true}"></input-text>
            </div>
        </div>

        <div class="row">
            <div class="col m2">
                <div class="input-field">
                    <select class="input-select" v-model="inspectionTime" v-validate="{required: true}">
                        <option v-for="time in times" :value="time">{{ time }}</option>
                    </select>
                    <label>Inspection</label>
                </div>
            </div>
            <div class="col m6">
                <div class="input-field">
                    <datepicker class="input-text" v-model="inspectionDate" format="dd/MM/yyyy" :disabled="disabledDates" :required="true"></datepicker>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col m6">
                <div class="input-field">
                    <select class="input-select" v-model="inspectorId" id="inspector-select" v-validate="{required: true}">
                        <option value="">Inspector...</option>
                        <option v-for="inspector in inspectors" :value="inspector.id">{{ inspector.firstName }} {{ inspector.lastName }}</option>
                    </select>
                    <label for="inspector-select">Inspector</label>
                </div>
            </div>
        </div>

        <b1-button :label="'Submit'" :action="submitForm" :fullWidth="true"></b1-button>
    </section>
</template>

<script>
import inputText from './inputs/N1_Text.vue'
import inputAddress from './inputs/N9_Address.vue'
import b1Button from './buttons/B1_button.vue'
import PostService from '../services/PostService.js'
import GetService from '../services/GetService.js'
import Datepicker from 'vuejs-datepicker'
import moment from 'moment'
import _ from 'lodash'

import axios from 'axios'
import { urlGetInspectors } from '../config.js'

export default {
    name: 'negotiator',
    provideValidator: true,
    inject: ['$validator'],
    mounted() {
        let p1 = this.getInspection();
        let p2 = this.getInspectors();
        let that = this;
        Promise.all([p1, p2]).then(function () {
            if(that.inspection.inspector_details && !_.find(that.inspectors, 'id', that.inspection.inspector_details.id)) {
                that.inspectors.unshift(that.inspection.inspector_details);
            }
        });
    },
    data() {
        return {
            inspection: {},
            options: {},
            inspectors: [],
            inspectorId: null,
            inspectionDate: new Date(),
            inspectionTime: '12:00 AM',
            disabledDates: {
                to: moment().subtract(1, 'd').toDate()
            }
        }
    },
    computed: {
        times() {
            let time = moment().hours(0).minutes(0);
            let result = [];
            do {
                result.push(time.format('hh:mm A'));
                time.add(15, 'm');
            } while(time.format('HH:mm') !== '00:00');
            return result;
        }
    },
    methods: {
        getInspection() {
            return GetService.getInspection(this.$route.params.id)
                .then(res => {
                    this.inspection = res.inspection;
                    this.options = res.options;
                    this.$store.commit('setInspection', res.inspection);
                    this.$store.commit('updateOptions', res.options);

                    this.inspectorId = this.inspection.inspector ? this.inspection.inspector[0] : null
                }).catch(e => {
                    console.error(e)
                })
        },
        getInspectors() {
            let that = this;
            return axios.get(urlGetInspectors)
                .then(response => {
                    that.inspectors = response.data;
                }).catch(e => {
                    console.error('Failed getting inspectors: ', e);
                });
        },
        submitForm() {
            this.$validator.validateAll().then((result) => {
                if (!result) {
                    this.scrollToInvalid();
                    return;
                }

                this.inspection.inspectionDate = {
                    date: moment(this.inspectionDate).format('DD/MM/YYYY'),
                    time: this.inspectionTime
                };
                this.inspection.rescheduled = 0;

                PostService.post(this.$route.params.id, this.inspection, this.options)
                    .then(response => {
                        this.$store.commit('setInspection', this.inspection);
                        this.$router.push('/');
                    }).catch(e => {
                        console.error(e)
                    })
            })
        }
    },
    watch: {
        inspectorId: function (id) {
            this.inspection.inspector = id ? [id] : [];
        }
    },
    components: {
        inputText,
        b1Button,
        Datepicker,
        inputAddress
    }
}
</script>
