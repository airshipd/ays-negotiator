<template>

  <section class="section-inspections">
    <div class="row">
      <div class="col list">
        <ul>
          <list v-for="(item, index) in inspections"
          :inspection="item"
          :active="index === activeLiIndex"
          :key="item.id"
          :index="index"
          @newactive="activeLiIndex = $event" >
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
          ></gmap-marker>
          <gmap-info-window
            :position="location"
            :options="infoOptions"
            @domready="customiseInfoWindow"
          >
            <div class="row">
              <div class="col title">{{inspection.title}}</div>
            </div>
            <div class="row">
              <div class="col address">{{inspection.address}}</div>
            </div>
          </gmap-info-window>
        </gmap-map>
      </div>
    </div>
  </section>

</template>

<script>

import list from './components/C1_listItem.vue'
import axios from 'axios'
import { urlGetInspections } from '../config.js'

export default {
    name: 'negotiator',
    mounted() {
        this.getInspections();
        this.getUserLocation();
        let that = this;

        $('.datepicker-negotiations').pickadate({
            format: 'dddd, mmm dd',
            min: new Date(new Date().setDate(new Date().getDate() - 30)),
            max: new Date(new Date().setDate(new Date().getDate() + 7)),
            selectYears: false,
            selectMonths: false,
            clear: false,
            onSet () {
                that.getInspections(this.get('select', 'yyyy-mm-dd'));
            },
            onClose () {
                //workaround for a bug when datepicker opens on tab switch https://github.com/amsul/pickadate.js/issues/160
                $(document.activeElement).blur();
            }
        });
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
        }
    },
    methods: {
        customiseInfoWindow() {
            $('.gm-style-iw').parent().addClass("gm-style-iw--wrapper")
            $('.gm-style-iw').next().addClass("gm-style-iw--close")
            $('.gm-style-iw--wrapper > div:first-of-type').addClass('gm-style-iw--remove')
        },
        getInspections(date) {
            axios.get(urlGetInspections, {params: {date}})
                .then(response => {
                    this.inspections = response.data
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
        }
    },
    components: {
        list
    },
    watch: {
        inspections() {
            this.activeLiIndex = 0
            this.$store.commit('updateLocation', {lat: this.inspections[0].lat, lng: this.inspections[0].lng})
            this.$store.commit('updateLocationData', this.inspections[0])
        }
    },
    computed: {
        location() {
            return this.$store.state.location
        },
        inspection() {
            return this.$store.state.locationData
        }
    }
}
</script>
