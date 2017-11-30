<template>

  <button class="btn" :class="{'btn--full-width': fullWidth}" @click="clickAction">{{label}}</button>

</template>

<script>
  export default {
    name: 'buttons-b-3-button',
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
