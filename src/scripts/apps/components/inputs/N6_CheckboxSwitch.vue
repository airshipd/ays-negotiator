<template>

  <div class="input-checkbox--switch">
    <input type="checkbox" :checked="shouldBeChecked" :value="value" @change="updateInput" :id="uniqueID">
    <label :for="uniqueID">{{label}}</label>
  </div>

</template>

<script>
  export default {
    name: 'input-n-3-checkboxCustom',
    modal: {
      prop: 'modelValue',
      event: 'change'
    },
    props: {
      modelValue: {
        default: "0"
      },
      label: {
        type: String,
        required: true
      },
      trueValue: {
        default: "1"
      },
      falseValue: {
        default: "0"
      }
    },
    mounted () {
    },
    data () {
      return {
      }
    },
    methods: {
      updateInput(event) {
        let isChecked = event.target.checked

        if (this.modelValue instanceof Array) {
          let newValue = [...this.modelValue]

          if (isChecked) {
            newValue.push(this.value)
          } else {
            newValue.splice(newValue.indexOf(this.value), 1)
          }

          this.$emit('input', newValue)
        } else {
          this.$emit('input', isChecked ? this.trueValue : this.falseValue)
        }
      }
    },
    computed: {
      uniqueID () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      shouldBeChecked() {
        if (this.modelValue instanceof Array) {
          return this.modelValue.includes(this.value)
        }
        // Note that `true-value` and `false-value` are camelCase in the JS
        return this.modelValue === this.trueValue
      }
    }
}
</script>
