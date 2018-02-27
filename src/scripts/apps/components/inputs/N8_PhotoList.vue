<template>

  <div class="row photo-list">
    <h3>{{label}}</h3>
    <label class="col m3" v-for="img in imgs">
      <img :src="img" alt="">
    </label>
    <label class="col m3 photo-list--add" v-if="imgs.length < 4">
      <input type="file" @change="actionAddPhoto">
    </label>
  </div>

</template>

<script>
export default {
    name: 'n-8-photolist',
    props: ['value','label','initialImages'],
    mounted() {
        if (this.initialImages instanceof Array) {
            this.initImages(this.initialImages);
        }
    },
    data() {
        return {
            imgs: []
        }
    },
    methods: {
        actionAddPhoto(e) {
            this.createPreview(e.target.files[0]);
            this.$emit('updated', e.target.files[0]);
        },
        createPreview(file) {
            if(file instanceof File) {
                let reader = new FileReader();
                reader.readAsDataURL(file); // read the image file as a data URL.
                reader.onload = (e) => {
                    this.imgs.push(e.target.result)
                }
            } else {
                //Asset object {id: ..., url: ...}
                this.imgs.push(file.url);
            }
        },
        initImages(images) {
            images.forEach((item) => this.createPreview(item))
        }
    },
    watch: {
        initialImages(images, old) {
            if (!old && images instanceof Array) {
                this.initImages(images);
            }
        }
    }
}
</script>