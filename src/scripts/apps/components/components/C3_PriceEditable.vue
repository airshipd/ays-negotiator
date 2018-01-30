<template>

  <input v-model="formatted" @focus="onFocus" @blur="onBlur" @keyup.enter="save" @keyup.esc="cancel">

</template>

<script>
export default {
  name: 'c-3-price-editable',
  props: ['value'],
  data () {
    return {
      formatted: this.currency(Math.round(this.value * 100) / 100),
      initial: this.value
    }
  },
  methods: {
    save () {
      this.$el.blur();
    },
    cancel () {
      this.formatted = this.initial;
      this.save();
    },
    onFocus () {
      if (this.formatted) {
        this.formatted = parseFloat(String(this.formatted).replace(/\$|,/g, ''));
      }
    },
    onBlur () {
      if(this.formatted) {
        let value = parseFloat(String(this.formatted).replace('$', '')) || 0;
        value = Math.round(value * 100) / 100;
        this.formatted = this.currency(value);
        this.$emit('input', value);
      }
    },
    currency (value) {
      return '$' + String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }

}
</script>
