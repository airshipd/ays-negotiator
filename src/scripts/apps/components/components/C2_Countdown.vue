<template>

  <div class="countdown"></div>

</template>

<script>
export default {
  name: 'c-2-countdown',
  props: [],
  mounted () {
    $(this.$el).countdown('2018/01/01', function(event) {
      $(this).html(event.strftime('%H:%M:%S'))
    });
  },
  beforeDestroy () {
    $(this.$el).countdown('destroy')
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
