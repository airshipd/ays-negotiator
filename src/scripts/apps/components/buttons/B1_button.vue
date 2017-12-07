<template>

  <button :class="classObj" @click="clickAction">{{label}}</button>

</template>

<script>
  export default {
    name: 'b-1-button',
    props: ['label', 'action', 'fullWidth', 'additionalClasses'],
    mounted () {

    },
    data () {
      return {

      }
    },
    methods: {
      clickAction () {
        this.action()
      }
    },
    computed: {
      classObj () {
        let retObj = {
          'btn': true,
          'btn-fullWidth': this.fullWidth
        }
        return Object.assign({}, retObj, this.additionalClasses)
      }
    },
}
</script>
