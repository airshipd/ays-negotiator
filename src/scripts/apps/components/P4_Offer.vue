<template>

  <section class="section-offer">

    <div class="offer">
      <!-- Report Meta -->
      <div class="row offer-meta">
        <div class="col m6">
          <h3>Inspection Done By:</h3>
          <p v-if="offer.mechanic">{{offer.mechanic.firstName}} {{offer.mechanic.lastName}} / Certified senior mechanic</p>
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
            <div class="comparison-average"><span>Average:</span>{{offer.averageTotalForCarType | currency}}</div>
            <div class="comparison-max"><span>Max:</span>{{offer.maxTotalForCarType | currency}}</div>
            <div class="comparison-bar"></div>
            <div class="comparison-bar--extra" :style="styleBarExtra"></div>
            <div class="comparison-needle" :style="styleComparisonNeedle">Your car: {{total | currency}}</div>
            <div class="comparison-price--extra" :style="styleComparisonExtra">+ {{profitAverage | currency}}</div>
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
      <div v-if="!loading">
        <div v-if="offer.telephoneEstimatedValuation > 0" class="divider offer-estimation">
          <h3>Phone Estimation</h3>
          {{offer.telephoneEstimatedValuation | currency }}
        </div>
        <div class="divider offer-valuation">
          <h3>On-site Valuation</h3>
          {{offer.onsitePhysicalValuation | currency}}
        </div>
        <div class="divider offer-repairs">
          <h3>Repair Needs</h3>
          <span class="discounted">{{offer.approximateExpenditure | currency}} <span>Discounted</span></span>
          <p>available if you accept today</p>
        </div>
        <div class="divider offer-previous">
          <h3 v-if="!hasReview">Regular Offer</h3>
          <h3 v-else>Previous Offer</h3>
          <span v-if="!hasReview">{{offer.averageTotalForCarType | currency}}</span>
          <span v-else>{{previousOffer | currency}}</span>
        </div>
        <div class="divider offer-final">
          <h3 v-if="!hasReview">Our Offer</h3>
          <h3 v-else>Final Offer</h3>
          {{total | currency}}
          <p v-if="hasReview">Get Paid by Friday 24th Novemeber</p>
        </div>
        <div class="buttons">
          <b-1-button v-if="!hasReview" :label="'Request Review'" :action="actionReview" :fullWidth="true" :additionalClasses="{'btn-review':true}"></b-1-button>
          <b-1-button v-else :label="'Decline'" :action="actionDecline" :fullWidth="true" :additionalClasses="{'btn-decline':true}"></b-1-button>
          <b-1-button :label="'Accept Offer'" :action="actionAccept" :fullWidth="true" :additionalClasses="{'btn-accept':true}"></b-1-button>
        </div>
      </div>
      <div class="offer-loading" v-if="loading">
        <p>We have received your request and are reprocessing your offer</p>
        <h3>Estimate time remaining</h3>
        <countdown :time="date" v-once></countdown>
      </div>
    </div>
  </section>

</template>


<script>
  import b1Button from './buttons/B1_button.vue'
  import countdown from './components/C2_countdown.vue'

  import moment from 'moment'
  import axios from 'axios'
  import { urlGetOffer } from '../config.js'

  export default {
    name: 'p-4-offer',
    props: [],
    beforeRouteEnter (to, from, next) {
      next(vm => {
        if( $.isEmptyObject(vm.$store.state.inspection) ) {
          next('/inspection/'+vm.$route.params.id)
        }
      })
    },
    mounted () {
      this.getOffer()

      //handle event of offer review updating
      window.eventBus.$on('updateOfferReview', (data,totalOffer ) => {
        this.loading = true
        this.offer = Object.assign({}, this.offer, data)
        this.total = totalOffer

        //make loading only last one minute
        window.setInterval(() => {
          this.loading = false
        },1000*60);
      })
    },
    beforeDestroy () {
      window.eventBus.$off('updateOfferReview')
    },
    data () {
      return {
        offer: {},
        options: [],
        total: [],
        loading: false,
        date: moment(new Date(moment().add(10,'minutes').unix()*1000)).format('YYYY/MM/DD HH:mm:ss')
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
        this.total = res.total
        this.$store.commit('updateInspection',res.data)
      },
      actionReview () {
        this.$store.commit('updateReviewModalApperance', true)
      },
      actionAccept () {
        axios.get(urlGetOffer+'/'+this.$route.params.id+'/accept')
        .then(response => {
          if( typeof(response.data.error) === 'undefined' ) {
            this.$router.push('/offer/'+this.$route.params.id+'/accept')
          } else {
            alert('error saving offer')
          }
        }).catch(e => {
          console.error(e)
        })
      },
      actionReject () {
        axios.get(urlGetOffer+'/'+this.$route.params.id+'/reject')
        .then(response => {
          if( typeof(response.data.error) === 'undefined' ) {
            this.$router.push('/offer/'+this.$route.params.id+'/reject')
          } else {
            alert('error saving offer')
          }
        }).catch(e => {
          console.error(e)
        })
      }
    },
    components: {
      b1Button,
      countdown
    },
    computed: {
      hasReview () {
        return this.offer.reviewPrice > 0
      },
      previousOffer () {
        return this.offer.onsitePhysicalValuation - this.offer.approximateExpenditure
      },
      profitAverage () {
        return this.total - this.offer.averageTotalForCarType
      },
      styleComparisonNeedle () {
        return {
          left: '50%'
        }
      },
      styleComparisonExtra () {
        return {
          left: '25%'
        }
      },
      styleBarExtra () {
        return {
          width: '50%'
        }
      }
    }
}
</script>

