<template>

  <div class="input-group">

    <div class="group-divider" v-for="item in options" :key="item.id">
      <input type="radio" >
    </div>

  </div>

</template>

<script>
  export default {
    name: 'input-n-1-text',
    props: ['label', 'options' ],
    mounted () {

    },
    data () {
      return {

      }
    },
    methods: {

    },
    computed: {

    },
}
</script>
