<template>

  <button class="btn" :class="{'btn--full-width': fullWidth}" @click="clickAction">{{label}}</button>

</template>

<script>
  export default {
    name: 'b-1-button',
    props: ['label', 'action', 'fullWidth'],
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

    },
}
</script>
