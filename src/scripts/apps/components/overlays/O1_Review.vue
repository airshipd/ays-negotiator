<template>

  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container modal-container--review">
          <button class="modal-btn--close" @click="closeAction"></button>

          <div class="row">
            <div class="col m7">
              <p>Tell us why you believe your car should be valued higher</p>
              <textarea-input v-model="reviewRequest" :name="'reviewRequest'" :validation-rules="{required:true}"></textarea-input>
            </div>
            <div class="col m5">
              <p>what figure in dollars you were expecting to receive?</p>
              <text-input v-model="reviewPrice" :name="'reviewPrice'" :validation-rules="{required:true,numeric:true}"></text-input>
              <div class="buttons">
                <b1-button :label="'Cancel'" :action="closeAction"></b1-button>
                <b1-button :label="'Submit Request'" :action="actionSubmit"></b1-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

</template>

<script>
import textInput from '../inputs/N1_Text.vue'
import numberInput from '../inputs/N7_Number.vue'
import textareaInput from '../inputs/N4_Textarea.vue'
import B1Button from '../buttons/B1_button.vue'

import { urlReviewOffer } from '../../config.js'

import qs from 'qs'
import moment from 'moment'
import axios from 'axios'

export default {
  name: 'o-1-review',
  provideValidator: true,
  inject: ['$validator'],
  props: [],
  mounted () {
  },
  data () {
    return {
      reviewPrice: null,
      reviewRequest: null
    }
  },
  methods: {
    closeAction () {
      this.$store.commit('updateReviewModalApperance', false)
    },
    actionSubmit () {
      this.$validator.validateAll().then((result) => {
        if(result) {
          // lets build out data object
          let sendObj = {
            id: this.$route.params.id,
            'reviewPrice': this.reviewPrice,
            'reviewRequest': this.reviewRequest
          }
          axios.post(urlReviewOffer,qs.stringify(sendObj))
          .then(response => {
            window.eventBus.$emit('updateOfferReview',{reviewPrice: this.reviewPrice, reviewRequest: this.reviewRequest},response.data.totalOffer)
            this.$store.commit('updateReviewModalApperance', false)
          }).catch(e => {
            console.error(e)
          })
        }
      })
    }
  },
  components: {
    numberInput,
    textareaInput,
    B1Button,
    textInput
  },
  computed: {
  }
}
</script>
