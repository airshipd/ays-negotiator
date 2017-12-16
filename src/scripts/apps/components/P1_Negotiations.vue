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
          ref="map"
        >
          <gmap-marker
            :position="location"
            :clickable="false"
            :draggable="false"
            :icon="mapIcon"
          ></gmap-marker>
          <!-- <gmap-info-window
            :position="location"
            :options="infoOptions"
            ref="marker"
            @domready="test"
          >
            <div>Hello world!</div>
          </gmap-info-window> -->
        </gmap-map>
      </div>
    </div>
  </section>

</template>

<script>

import list from './components/C1_listItem.vue'
import axios from 'axios'
import { urlGetInspections } from '../config.js'

// refer to https://developers.google.com/maps/documentation/javascript/examples/overlay-popup
function definePopupClass() {
  /**
   * A customized popup on the map.
   * @param {!google.maps.LatLng} position
   * @param {!Element} content
   * @constructor
   * @extends {google.maps.OverlayView}
   */
  Popup = function(position, content) {
    this.position = position;

    content.classList.add('popup-bubble-content');

    var pixelOffset = document.createElement('div');
    pixelOffset.classList.add('popup-bubble-anchor');
    pixelOffset.appendChild(content);

    this.anchor = document.createElement('div');
    this.anchor.classList.add('popup-tip-anchor');
    this.anchor.appendChild(pixelOffset);

    // Optionally stop clicks, etc., from bubbling up to the map.
    this.stopEventPropagation();
  };
  // NOTE: google.maps.OverlayView is only defined once the Maps API has
  // loaded. That is why Popup is defined inside initMap().
  Popup.prototype = Object.create(google.maps.OverlayView.prototype);

  /** Called when the popup is added to the map. */
  Popup.prototype.onAdd = function() {
    this.getPanes().floatPane.appendChild(this.anchor);
  };

  /** Called when the popup is removed from the map. */
  Popup.prototype.onRemove = function() {
    if (this.anchor.parentElement) {
      this.anchor.parentElement.removeChild(this.anchor);
    }
  };

  /** Called when the popup needs to draw itself. */
  Popup.prototype.draw = function() {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
    // Hide the popup when it is far out of view.
    var display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
        'block' :
        'none';

    if (display === 'block') {
      this.anchor.style.left = divPosition.x + 'px';
      this.anchor.style.top = divPosition.y + 'px';
    }
    if (this.anchor.style.display !== display) {
      this.anchor.style.display = display;
    }
  };

  /** Stops clicks/drags from bubbling up to the map. */
  Popup.prototype.stopEventPropagation = function() {
    var anchor = this.anchor;
    anchor.style.cursor = 'auto';

    ['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart',
     'pointerdown']
        .forEach(function(event) {
          anchor.addEventListener(event, function(e) {
            e.stopPropagation();
          });
        });
  };
}

export default {
  name: 'negotiator',
  mounted () {
    this.getInspections()
    this.getUserLocation()
  },
  data () {
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
          height: -35
        }
      },
    }
  },
  methods: {
    test(el) {
      console.log(this.$refs)
      $(this.$refs.marker.$el).parent()[0]
    },
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
