<template>

  <div class="btn-nextStep--wrap">{{label}}<button :class="classObj" @click="clickAction"></button></div>

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
          'btn-nextStep': true,
        }
        return Object.assign({}, retObj, this.additionalClasses)
      }
    },
}
</script>
