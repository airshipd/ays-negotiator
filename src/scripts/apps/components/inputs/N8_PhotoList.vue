<template>

  <div class="row photo-list">
    <h3>{{label}}</h3>
    <label class="col m3" v-for="img in imgs">
      <img :src="img" alt="">
    </label>
    <label class="col m3 photo-list--add" v-if="!hideAdd">
      <input type="file" @change="actionAddPhoto">
    </label>
  </div>

</template>

<script>
export default {
  name: 'n-8-photolist',
  props: ['value','label','initialImages'],
  mounted () {
    if( this.initialImages !== undefined && this.initialImages !== null ) {
      // if is array of files
      if( typeof this.initialImages[0].name == 'string' ) {
        this.initialImages.forEach((item) => { this.createPreview(item) })
      }
    }
  },
  data () {
    return {
      imgs: [],
      hideAdd: false
    }
  },
  methods: {
    actionAddPhoto (e) {
      this.createPreview(e.target.files[0])
      this.$emit('updated', e.target.files[0])
    },
    createPreview (file) {
      let reader = new FileReader()
      reader.readAsDataURL(file) // read the image file as a data URL.
      reader.onload = (e) => {
        this.imgs.push(e.target.result)
      }
    }
  },
  watch: {
    imgs () {
      this.hideAdd = this.imgs.length >= 4 ? true : false
    }
  },
}
</script>
