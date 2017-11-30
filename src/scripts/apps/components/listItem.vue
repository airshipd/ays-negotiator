<template>

  <li @click="clickAction">
    <div class="row">
      <div class="col title">{{inspection.title}}</div>
      <div class="col status">{{showProperStatus(inspection.status)}}</div>
    </div>
    <div class="row">
      <div class="col address">{{inspection.address}}</div>
      <div :class="classObj"></div>
    </div>
    <div class="icon-chevronRight"></div>
  </li>

</template>

<script>
  export default {
    name: 'list-items',
    props: ['inspection', 'action'],
    mounted () {
      console.log(this.inspection)
    },
    data () {
      return {
      }
    },
    methods: {
      clickAction () {
        console.log('i happed')
      },
      showProperStatus(status) {
        let theStatus = ''
        switch(status) {
          case 'UpComing':
            theStatus = 'Up Coming'
            break;
          case 'finalized':
            theStatus = 'Finalized'
            break;
          case 'Accepted':
            theStatus = 'Accepted'
            break;
          default:
            theStatus = 'No Status'
        }
        return theStatus
      },
    },
    computed: {
      classObj () {
        return {
          col: true,
          distance: this.inspection.status !== 'finalized' ? true : false,
          report: this.inspection.status === 'finalized' ? true : false
        }
      }
    },
}
</script>
