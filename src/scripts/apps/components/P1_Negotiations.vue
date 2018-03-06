<template>
    <section class="section-inspections">
        <div class="row">
            <div class="col list">
                <loader v-show="showLoader"/>

                <ul v-show="!showLoader">
                    <list v-for="(item, index) in inspections"
                        :inspection="item"
                        :active="index === activeLiIndex"
                        :key="item.id"
                        :index="index"
                        @newactive="activeLiIndex = $event">
                    </list>
                </ul>
            </div>
            <div class="col map">
                <gmap-map
                    :center="location"
                    :zoom="13"
                    :style="{width: '100%', height: '100%'}"
                >
                    <gmap-marker
                        :position="location"
                        :clickable="false"
                        :draggable="false"
                        :icon="mapIcon"
                        v-if="inspection"
                    ></gmap-marker>
                    <gmap-info-window
                        :position="location"
                        :options="infoOptions"
                        v-if="inspection"
                        @domready="customiseInfoWindow"
                    >
                        <div class="row">
                            <div class="col title">{{ inspection.title }}</div>
                        </div>
                        <div class="row">
                            <div class="col address">{{ inspection.address }}</div>
                        </div>
                    </gmap-info-window>
                </gmap-map>
            </div>
        </div>
    </section>
</template>

<script>

import list from './components/C1_listItem.vue'
import loader from './components/C4_Spinner.vue'
import axios from 'axios'
import { urlGetInspections } from '../config.js'
import moment from 'moment'

export default {
    name: 'negotiator',
    props: ['type', 'date', 'state'],
    mounted() {
        this.getInspections();
        this.getUserLocation();

        if(this.$route.name === 'Negotiations') {
            this.initDatepicker();
        }
    },
    data() {
        return {
            inspections: [],
            activeLiIndex: null,
            infoContent: '',
            mapIcon: {
                url: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB3aWR0aD0iNDVweCIgaGVpZ2h0PSI0NXB4IiB2aWV3Qm94PSIwIDAgNDUgNDUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+ICAgIDx0aXRsZT5Hcm91cDwvdGl0bGU+ICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPiAgICA8ZGVmcz48L2RlZnM+ICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPiAgICAgICAgPGcgaWQ9IjFfSk9CLVNDUkVFTiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc3My4wMDAwMDAsIC0zMTguMDAwMDAwKSI+ICAgICAgICAgICAgPGcgaWQ9Ikdyb3VwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg3NzMuMDAwMDAwLCAzMTguMDAwMDAwKSI+ICAgICAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwtMiIgZmlsbD0iIzM3NkNBQiIgb3BhY2l0eT0iMC40MzAxOTcwMTEiIGN4PSIyMi41IiBjeT0iMjIuNSIgcj0iMjIuNSI+PC9jaXJjbGU+ICAgICAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwtMiIgZmlsbD0iIzZDQ0JGOCIgY3g9IjIzIiBjeT0iMjMiIHI9IjQiPjwvY2lyY2xlPiAgICAgICAgICAgIDwvZz4gICAgICAgIDwvZz4gICAgPC9nPjwvc3ZnPg=='
            },
            infoOptions: {
                pixelOffset: {
                    width: 0,
                    height: -15
                }
            },
            showLoader: false
        }
    },
    methods: {
        customiseInfoWindow() {
            $('.gm-style-iw').parent().addClass("gm-style-iw--wrapper")
            $('.gm-style-iw').next().addClass("gm-style-iw--close")
            $('.gm-style-iw--wrapper > div:first-of-type').addClass('gm-style-iw--remove')
        },
        getInspections() {
            this.showLoader = true;
            axios.get(urlGetInspections, {
                params: {
                    date: this.date,
                    state: this.state,
                    upcoming: this.type === 'upcoming' ? 1 : 0,
                    rejected: this.type === 'rejected' ? 1 : 0,
                }
            })
            .then(response => {
                this.inspections = response.data
                this.showLoader = false;
            }).catch(e => {
                console.log(e)
            })
        },
        getUserLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    this.$store.commit('updateUserLocation', {lat: position.coords.latitude, lng: position.coords.longitude})
                }, () => {
                    this.handleLocationError(true);
                });
            } else {
                this.handleLocationError(false);
            }
        },
        handleLocationError(browserHasGeolocation) {
            console.log(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.')
        },
        initDatepicker () {
            let that = this;
            let $datepicker = $('.datepicker-negotiations');

            $datepicker.pickadate({
                format: 'dddd, mmm dd',
                min: new Date(new Date().setDate(new Date().getDate() - 30)),
                max: new Date(new Date().setDate(new Date().getDate() + 7)),
                selectYears: false,
                selectMonths: false,
                clear: false,
                onSet () {
                    that.$router.push({
                        params: {
                            date: this.get('select', 'yyyy-mm-dd')
                        }
                    })
                },
                onClose () {
                    //workaround for a bug when datepicker opens on tab switch https://github.com/amsul/pickadate.js/issues/160
                    $(document.activeElement).blur();
                }
            });

            $datepicker.pickadate('picker').set('select',  moment(this.$route.params.date).toDate(), {muted: true});
        }
    },
    components: {
        list,
        loader
    },
    watch: {
        inspections() {
            this.activeLiIndex = 0;
            this.$store.commit('updateLocation', this.inspections[0]);
        },
        '$route': function(r) {
            if(this.type === 'upcoming') {
                let pickadate = $('.datepicker-negotiations').pickadate('picker');
                if(pickadate.get('select', 'yyyy-mm-dd') !== this.date) {
                    if(this.date) {
                        pickadate.set('select',  moment(this.date).toDate());
                    } else {
                        this.$router.push({
                            params: {
                                date: pickadate.get('select', 'yyyy-mm-dd')
                            }
                        });
                        return;
                    }
                }
            }

            this.getInspections();
        }
    },
    computed: {
        location() {
            if(this.inspection) {
                return {lat: this.inspection.lat, lng: this.inspection.lng};
            } else {
                return {lat: -37.814062, lng: 144.962693}; //Melbourne Center
            }
        },
        inspection() {
            return this.inspections[this.activeLiIndex] && this.inspections[this.activeLiIndex].lat ? this.inspections[this.activeLiIndex] : null;
        }
    }
}
</script>