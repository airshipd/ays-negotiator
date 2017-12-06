<template>

  <div class="input-group">
    <label>{{label}}</label>

    <div class="group-wrapper row">
      <div class="group-divider col" v-for="(item, index) in options" :key="item.value">
        <input type="radio" ref="input" v-bind:value="item.value" v-on:click="updateValue($event.target.value)" :name="name" :id="index+'-label-'+name" :checked="getChecked(item)">
        <label :for="index+'-label-'+name">{{item.label}}</label>
      </div>
    </div>
  </div>

</template>

<script>
  export default {
    name: 'input-n-2-ChoiceGroup',
    props: ['label', 'options', 'value', 'name'],
    mounted () {

    },
    data () {
      return {

      }
    },
    methods: {
      updateValue: function (value) {
        console.log(value);
        this.$emit('input', value)
      },
      uniqueID () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      getChecked (item) {
        return (parseInt(item.default) && this.value === null) ? true : (this.value === item.value) ? true : false
      }
    },
    computed: {
    },
}
</script>
