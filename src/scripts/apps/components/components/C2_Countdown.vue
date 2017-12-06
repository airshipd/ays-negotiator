<template>

  <div class="countdown"></div>

</template>

<script>
export default {
  name: 'c-2-countdown',
  props: ['time'],
  mounted () {
    $(this.$el).countdown(this.time, function(event) {
      $(this).html(event.strftime('<span>%M</span>:<span>%S</span>'))
    });
  },
  beforeDestroy () {
    $(this.$el).off()
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
