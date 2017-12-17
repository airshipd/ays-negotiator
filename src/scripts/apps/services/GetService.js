import axios from 'axios'
import qs from 'qs'
import striptags from 'striptags'
import { urlGetInspection } from '../config.js'

export default {

  getInspection (routeId) {
    return new Promise((resolve, reject) => {
      axios.get(urlGetInspection+'/'+routeId)
        .then(response => {
          resolve( this.formatData(response.data) )
        }).catch(e => {
          reject(e)
        })
      })
  },
  formatData (res) {
    res.data.transmission = res.data.transmission ? res.data.transmission : 'auto'
    res.data.colour = res.data.colour ? res.data.colour : 'silver'
    res.data.engineType = res.data.engineType ? res.data.engineType : 'petrol'
    res.data.seats = res.data.seats === "0" ? "2" : res.data.seats
    res.data.doors = res.data.doors === "0" ? "2" : res.data.doors
    res.data.damageAndFaults = striptags(res.data.damageAndFaults)
    return {
      'inspection': res.data,
      'options': res.options
    }
  },

}