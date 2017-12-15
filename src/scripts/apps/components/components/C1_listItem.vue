<template>

  <li @click.stop="toggleRowActive" :class="itemClass" >
    <div class="row">
      <div class="col title">{{inspection.title}}</div>
      <div class="col status">{{showProperStatus(inspection.status)}}</div>
    </div>
    <div class="row">
      <div class="col address">{{inspection.address}}</div>
      <div :class="bottomClass"><i class="material-icons">keyboard_arrow_right</i></div>
    </div>
    <div class="click-wrapper" @click="goToInspection()"></div>
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
          case 'rejected':
            theStatus = 'Accepted'
            break;
          case 'accepted':
            theStatus = 'Rejected'
            break;
          default:
            theStatus = 'No Status'
        }
        return theStatus
      },
      toggleRowActive() {
        this.$emit('newactive', this.index);
        this.$store.commit('updateLocation', {lat: this.inspection.lat, lng: this.inspection.lng })
      },
      goToInspection() {
        this.$router.push('inspection/'+this.inspection.id)
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
      itemClass () {
        return {
          inspection: true,
          active: this.active,
          'z-depth-1': this.active
        }
      }
    },
}
</script>
