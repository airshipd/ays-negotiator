<template>

  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container modal-container--signature">
          <button class="modal-btn--close" @click="actionClose"></button>
          <canvas ref="canvas" class="signature"></canvas>
          <div class="btn-group">
              <b1-button class="btn btn-signature--clear" :action="actionClear" :label="'Clear'"></b1-button>
              <b1-button class="btn btn-signature--submit" :action="actionSave" :label="'Submit'"></b1-button>
          </div>
        </div>
      </div>
    </div>
  </transition>

</template>

<script>
import SignaturePad from 'signature_pad'
import B1Button from '../buttons/B1_button.vue'


SignaturePad.prototype.removeBlanks = function () {
  var imgWidth = this._ctx.canvas.width;
  var imgHeight = this._ctx.canvas.height;
  var imageData = this._ctx.getImageData(0, 0, imgWidth, imgHeight),
  data = imageData.data,
  getAlpha = function(x, y) {
    return data[(imgWidth*y + x) * 4 + 3]
  },
  scanY = function (fromTop) {
    var offset = fromTop ? 1 : -1;

    // loop through each row
    for(var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {

      // loop through each column
      for(var x = 0; x < imgWidth; x++) {
        if (getAlpha(x, y)) {
          return y;
        }
      }
    }
    return null; // all image is white
  },
  scanX = function (fromLeft) {
    var offset = fromLeft? 1 : -1;

    // loop through each column
    for(var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {

      // loop through each row
      for(var y = 0; y < imgHeight; y++) {
        if (getAlpha(x, y)) {
          return x;
        }
      }
    }
    return null; // all image is white
  };

  var cropTop = scanY(true),
  cropBottom = scanY(false),
  cropLeft = scanX(true),
  cropRight = scanX(false);

  var relevantData = this._ctx.getImageData(cropLeft, cropTop, cropRight-cropLeft, cropBottom-cropTop);
  this._canvas.width = cropRight-cropLeft;
  this._canvas.height = cropBottom-cropTop;
  this._ctx.clearRect(0, 0, cropRight-cropLeft, cropBottom-cropTop);
  this._ctx.putImageData(relevantData, 0, 0);

  return relevantData;
}


export default {
  props: {
    value: String,
  },
  data() {
    return {
      pad: null,
      canvas: null
    };
  },
  mounted() {
    this.canvas = this.$refs.canvas
    this.pad = new SignaturePad(this.canvas)
    this.resizeCanvas()
  },
  methods: {
    actionClose () {
      this.pad.off()
      this.$emit('close', true)
    },
    actionSave () {
       if (this.pad.isEmpty()) {
        alert("Please provide signature first.");
      } else {
        let signatureClone = $.extend(true, {}, this.pad)
        signatureClone.removeBlanks()
        this.$emit('input', signatureClone.toDataURL())
        this.pad.off()
        this.$emit('close', true)
      }
    },
    actionClear () {
      this.pad.clear();
      this.$emit('input', this.pad.toDataURL())
    },
    resizeCanvas() {
      let ratio =  Math.max(window.devicePixelRatio || 1, 1)
      this.canvas.width = this.canvas.offsetWidth * ratio
      this.canvas.height = this.canvas.offsetHeight * ratio
      this.canvas.getContext("2d").scale(ratio, ratio)
      this.pad.clear(); // otherwise isEmpty() might return incorrect value
    }
  },
  components: {
    B1Button
  }
}
</script>
