<template>

  <section class="section-offer">

    <div class="offer">
      <!-- Report Meta -->
      <div class="row offer-meta">
        <div class="col m6">
          <h3>Inspection Done By:</h3>
          <p>{{offer.mechanicName}} / {{offer.jobTitle}}</p>
        </div>
        <div class="col m6">
          <h3>Prepared For:</h3>
          <p>{{offer.customerName}}</p>
        </div>
      </div>

      <!-- Report Comparison -->
      <div class="row offer-main">
        <h3>Comparison</h3>
        <div class="col m12 ">
          <div class="comparison">
            <div class="comparison-average"></div>
            <div class="comparison-max"></div>
            <div class="comparison-bar"></div>
            <div class="comparison-needle"></div>
            <div class="comparison-price--extra"></div>
            <div class="comparison-yourCar"></div>
          </div>
        </div>
      </div>


      <div class="row offer-issues">
        <h3>Issues</h3>
        <div class="col m8 offer-condition">
          Your car is in better condition than the average {{offer.make}} {{offer.model}} we buy, nice one!
        </div>
        <div class="col m3 push-m1 offer-grade">
          Overall <span>{{offer.grade}}</span>
        </div>
      </div>

      <div class="row offer-issues--list">
        <p>We have identified the following issues:</p>
        <ul>
          <li v-for="item in issues">
            <div class="image"><i :class="getIssueIconClass(item)"></i></div>
            <div class="body">
              <h3>{{item.title}}</h3>
              <p>{{item.description}}</p>
            </div>
            <div class="rating"></div>
          </li>
        </ul>
      </div>
    </div>

    <div class="side">
      <div class="divider offer-estimation">
        <h3>Phone Estimation</h3>
        {{offer.estimation}}
      </div>
      <div class="divider offer-valuation">
        <h3>On-site Valuation</h3>
        {{offer.valuation}}
      </div>
      <div class="divider offer-repairs">
        <h3>Repair Needs</h3>
        <span class="discounted">{{offer.discount}} <span>Discounted</span></span>
        <p>available if you accept today</p>
      </div>
      <div class="divider offer-previous">
        <h3>Previous Offer</h3>
        {{offer.discount}}
      </div>
      <div class="divider offer-final">
        <h3>Final Offer</h3>
        {{offer.discount}}
        <p>Get Paid by Friday 24th Novemeber</p>
      </div>
      <div class="buttons">
        <!-- <b1-button :label="'Decline'" :action="actionDecline" :fullWidth="true"></b1-button>
        <b1-button :label="'Accept'" :action="actionAccept" :fullWidth="true"></b1-button> -->
      </div>
    </div>
  </section>

</template>


<script>
  // import b1Button from './buttons/B1_button.vue'
  import axios from 'axios'
  import { urlGetOffer } from '../config.js'

  export default {
    name: 'p-4-offer',
    props: [],
    mounted () {
      this.getOffer()
    },
    data () {
      return {
        offer: {},
        options: [],
      }
    },
    methods: {
      getIssueIconClass (item) {
        return 'icon-'+item.type
      },
      getOffer () {
        axios.get(urlGetOffer+'/'+this.$route.params.id)
        .then(response => {
          console.log('Offer data', response.data)
          this.formatData(response.data)
        }).catch(e => {
          console.error(e)
        })
      },
      formatData (res) {
        this.offer = res.data
        this.options = res.options
        this.$store.commit('updateInspection',res.data)
      },
    },
    components: {
      // B1Button
    },
}
</script>

