<template>

  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container modal-container--signature">
          <button class="modal-btn--close" @click="closeAction"></button>
          <canvas class="signature"></canvas>
          <div class="btn-group">
              <button class="btn-signature--clear" :action="clear" :label="Clear"></button>
              <button class="btn-signature--submit" :action="submit" :label="Submit"></button>
          </div>
        </div>
      </div>
    </div>
  </transition>

</template>

<script>
import SignaturePad from 'signature_pad'
import b1Button from '../buttons/B1_button.vue'
import trimCanvas from 'trim-canvas'

export default {
  props: {
    value: String,
  },
  data() {
    return {
        pad: null,
    };
  },
  mounted() {
    let canvas = document.querySelector('canvas')
    this.pad = new SignaturePad(canvas)
  },
  methods: {
    actionClose () {
      this.pad.off()
      this.$store.commit('updateSignatureModalApperance', false)
    },
    actionSave () {
       if (this.pad.isEmpty()) {
        alert("Please provide signature first.");
      } else {
        let signatureClone = $.extend(true, {}, this.pad)
        trimCanvas(signatureClone)
        this.$emit('input', this.pad.toDataURL())
        this.pad.off()
        this.$store.commit('updateSignatureModalApperance', false)
      }
    },
    actionClear () {
      this.pad.clear();
      this.$emit('input', this.pad.toDataURL())
    },
    resizeCanvas() {
      let ratio =  Math.max(window.devicePixelRatio || 1, 1)
      let canvas = document.querySelector('canvas')
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext("2d").scale(ratio, ratio)
      this.pad.clear(); // otherwise isEmpty() might return incorrect value
    }
  }
}
</script>
