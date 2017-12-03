<template>

  <section class="section-waiting">
    <h3>We're just reviewing your offer</h3>
    <div class="time">
      <!-- <countdown deadline="August 22, 2022"></countdown> -->
      <countdown
          ref="countdown"
          :time="30"
          @onProgress="countDownProgress"
          @onFinish="countDownFinished"
      >Time Remaining: {{countDownSeconds}} seconds.
      </countdown>
    </div>
    <p>Checking details of your vehicle</p>
    <div class="vehicles"></div>
  </section>

</template>

<script>
import countdown from 'vuejs-count-down'

export default {
  name: 'waiting',
  props: [],
  mounted () {

  },
  data () {
    return {

    }
  },
  methods: {
    countDownProgress(time) {
        this.countDownSeconds = time
    }
  },
  components: {
    countdown
  }
}
</script>
