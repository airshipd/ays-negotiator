<template>
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
        ></gmap-marker>
      </gmap-map>
    </div>
  </div>
</template>

<script>

import list from './components/C1_listItem.vue'
import axios from 'axios'

import { urlGetInspections } from '../config.js'

export default {
  name: 'negotiator',
  mounted () {
    this.getInspections()
    this.getUserLocation()
  },
  data () {
    return {
      inspections: [],
      activeLiIndex: null
    }
  },
  methods: {
    getInspections () {
      axios.get(urlGetInspections)
      .then(response => {
        this.inspections = response.data
      }).catch(e => {
        console.log(e)
      })
    },
    getUserLocation () {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( (position) => {
          this.$store.commit('updateUserLocation', {lat: position.coords.latitude, lng: position.coords.longitude })
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
    inspections () {
      this.activeLiIndex = 0
      this.$store.commit('updateLocation', {lat: this.inspections[0].lat, lng: this.inspections[0].lng })
    }
  },
  computed: {
    location () {
      return this.$store.state.location
    }
  }
}
</script>
