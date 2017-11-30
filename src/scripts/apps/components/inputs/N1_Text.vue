<template>

  <div class="input-field">
    <input type="text" class="input-text" :id="uniqueID">
    <label :for="uniqueID">{{label}}</label>
  </div>

</template>

<script>
  export default {
    name: 'input-n-1-text',
    props: ['name','label'],
    mounted () {
      console.log(this.label)
    },
    data () {
      return {

      }
    },
    methods: {

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
