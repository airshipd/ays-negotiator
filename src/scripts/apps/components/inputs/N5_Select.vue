<template>

  <div class="input-field">
    <select class="input-select" :id="uniqueID" ref="input" v-bind:value="value" v-on:input="updateValue($event.target.value)">
      <option v-for="option in options" :key="option.value" >{{option.value}}</option>
    </select>
    <label :for="uniqueID">{{label}}</label>
  </div>

</template>

<script>
  export default {
    name: 'input-n-5-select',
    props: ['label','value','options'],
    mounted () {
    },
    data () {
      return {

      }
    },
    methods: {
      updateValue: function (value) {
        this.$emit('input', value)
      }
    },
    computed: {
      uniqueID () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    },
}
</script>
