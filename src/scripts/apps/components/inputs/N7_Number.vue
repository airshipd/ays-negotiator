<template>

  <div class="input-field">
    <input type="number" class="input-number" :name="name" :id="uniqueID" ref="input" v-bind:value="value" v-on:input="updateValue($event.target.value)" step="1" v-validate="validationRules" :disabled="disabled">
    <label :for="uniqueID">{{label}}</label>
    <span v-show="errors.has(name)" class="help is-danger">{{ errors.first(name) }}</span>
  </div>

</template>

<script>
  export default {
    name: 'input-n-7-number',
    inject: ['$validator'],
    props: {
      name: {
        type: String
      },
      label: {
        type: String
      },
      value: {
        type: Number
      },
      disabled: {
        type: Boolean
      },
      validationRules: {
        type: Object,
        default () {
          return {
            required: false
          }
        }
      }
    },
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
