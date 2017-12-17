<template>

  <li @click.stop="toggleRowActive" :class="itemClass(inspection.status)" >
    <div class="row">
      <div class="col title">{{inspection.title}}</div>
      <div class="col status">{{showProperStatus(inspection.status)}}</div>
    </div>
    <div class="row">
      <div class="col address">{{inspection.address}}</div>
      <div :class="bottomClass"><i class="material-icons">keyboard_arrow_right</i></div>
    </div>
    <div class="click-wrapper" @click="goToAction(inspection.status)"></div>
  </li>

</template>

<script>
  export default {
    name: 'list-items',
    props: ['inspection', 'action', 'active', 'index'],
    mounted () {
    },
    data () {
      return {

      }
    },
    methods: {
      showProperStatus(status) {
        let theStatus = ''
        switch(status) {
          case 'UpComing':
            theStatus = 'Up Coming'
            break;
          case 'finalized':
            theStatus = 'Finalized'
            break;
          case 'Rejected':
            theStatus = 'Rejected'
            break;
          case 'Accepted':
            theStatus = 'Accepted'
            break;
          default:
            theStatus = 'No Status'
        }
        return theStatus
      },
      toggleRowActive() {
        this.$emit('newactive', this.index);
        this.$store.commit('updateLocation', {lat: this.inspection.lat, lng: this.inspection.lng })
        this.$store.commit('updateLocationData', this.inspection)
      },
      goToAction(status) {
        if( status === 'finalized' ) {
          this.$router.push('report/'+this.inspection.id)
        } else if( status === 'Rejected' )
          this.$router.push('final/1/'+this.inspection.id)
        else {
          this.$router.push('inspection/'+this.inspection.id)
        }
      },
      itemClass (status) {
        let obj = {
          inspection: true,
          active: this.active,
          'z-depth-1': this.active
        }
        obj[status] = true

        return obj
      }
    },
    computed: {
      bottomClass () {
        return {
          col: true,
          distance: this.inspection.status !== 'finalized' ? true : false,
          report: this.inspection.status === 'finalized' ? true : false
        }
      },
    },
}
</script>
