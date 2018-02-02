<template>

  <section class="section-offer">

    <div class="offer">
      <!-- Report Meta -->
      <div class="row offer-meta">
        <div class="col m6">
          <h3>Inspection Done By:</h3>
          <p v-if="offer.mechanic"><span>{{offer.mechanic.firstName}} {{offer.mechanic.lastName}}</span> / Certified senior mechanic</p>
        </div>
        <div class="col m6">
          <h3>Prepared For:</h3>
          <p><span>{{offer.customerName}}</span></p>
        </div>
      </div>

      <!-- Report Comparison -->
      <div class="row offer-main">
        <h3>Comparison</h3>
        <div class="col m12 ">
          <div class="comparison">
            <div class="comparison-average"><span>Minimum:</span>{{ minPrice | currency }}</div>
            <div class="comparison-max"><span>Max:</span>{{ maxPrice | currency }}</div>
            <div class="comparison-bar"></div>
            <div class="comparison-bar--extra" :style="styleBarExtra"></div>
            <div class="comparison-needle" :style="styleComparisonNeedle">Your car: <span>{{ currentTotal | currency }}</span></div>
            <div class="comparison-price--extra" :style="styleComparisonExtra">+ {{ profitAverage | currency }}</div>
          </div>
        </div>
      </div>

      <div class="row offer-issues">
        <h3>Issues</h3>
        <div class="col m8 offer-condition">
          Your car fits in the 'average' {{inspection.make}} {{inspection.model}} band of vehicles we buy.
        </div>
        <div class="col m3 push-m1 offer-grade">
          Overall <span>C</span>
        </div>
      </div>

      <div class="row offer-issues--list">
        <p>We have identified the following issues:</p>
        <ul>
          <li v-for="item in report" :key="item.title" :class="getIssueIconClass(item)" v-if="item.score">
            <div class="body">
              <h3>{{item.title}}</h3>
              <p>{{item.description}}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="side">
      <div v-if="!loading && total > 0">
        <div class="divider offer-valuation">
          <h3>On-site Valuation</h3>
          <price-editable class="offer-valuation-editable" v-model="offer.onsitePhysicalValuation"></price-editable>
        </div>
        <div class="divider offer-repairs">
          <h3>Repair Needs</h3>
          <span class="discounted">- {{offer.approximateExpenditure | currency}}</span>
        </div>
        <div class="divider offer-previous" v-if="hasReview">
          <h3>Previous Offer</h3>
          <span>{{ previousOffer | currency }}</span>
        </div>
        <div class="divider offer-final">
          <template v-if="hasReview">
            <h3>Final Offer</h3>
            {{ total | currency }}
            <p>Get Paid by {{ getPaidDate }}</p>
          </template>
          <template v-else>
            <h3>Our Offer</h3>
            {{ previousOffer | currency }}
          </template>
        </div>
        <div class="buttons">
          <b-1-button v-if="!hasReview" :label="'Request Review'" :action="actionReview" :fullWidth="true" :additionalClasses="{'btn-review':true}"></b-1-button>
          <b-1-button v-else :label="'Decline'" :action="actionDecline" :fullWidth="true" :additionalClasses="{'btn-decline':true}"></b-1-button>
          <b-1-button :label="'Accept Offer'" :action="actionAccept" :fullWidth="true" :additionalClasses="{'btn-accept':true}"></b-1-button>
        </div>
      </div>
      <div class="offer-loading" v-if="loading && total > 0">
        <p>We have received your request and are reprocessing your offer</p>
        <h3>Estimate time remaining</h3>
        <countdown :time="date"></countdown>
      </div>
      <template v-if="total <= 0 && total !== null">
        <div class="offer-negative">
            <p>It looks like we need to do some more research before we can make you an offer.</p>
            <p>One of our consultants will be in touch shortly to discuss your vehicle!</p>
        </div>
        <div class="buttons">
          <b-1-button :label="'Proceed to Paperwork'" :action="actionProceed" :fullWidth="true" class="btn-proceed"></b-1-button>
        </div>
      </template>
    </div>
  </section>

</template>


<script>
  import b1Button from './buttons/B1_button.vue'
  import countdown from './components/C2_countdown.vue'
  import priceEditable from './components/C3_PriceEditable.vue'

  import moment from 'moment'
  import axios from 'axios'
  import qs from 'qs'
  import { urlGetOffer, urlOfferUpdateValuation } from '../config.js'

  export default {
    name: 'p-4-offer',
    props: [],
    mounted () {
      this.getOffer()

      //handle event of offer review updating
        window.eventBus.$on('updateOfferReview', (data, totalOffer) => {
            this.loading = true
            this.date = moment(new Date(moment().add(3, 'minutes').unix() * 1000)).format('YYYY/MM/DD HH:mm:ss')

            //make loading only last one minute
            this.reviewTimer = window.setInterval(() => {
                this.loading = false
                this.offer = Object.assign({}, this.offer, data)
                this.total = totalOffer
            }, 1000 * 60);
        })
    },
    beforeDestroy () {
      window.clearInterval(this.reviewTimer);
      window.eventBus.$off('updateOfferReview')
    },
    data () {
      return {
        offer: {},
        options: [],
        report: [],
        total: null,
        loading: false,
        date: null,
        getPaidDate: moment(new Date(moment().add(1,'day').unix()*1000)).format('dddd Do MMMM'),
        reviewTimer: null
      }
    },
    methods: {
      getIssueIconClass (item) {
        return 'icon-'+item.title.replace(/ +/g, "").toLowerCase()
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
        this.report = res.report
        this.total = res.total
        this.$store.commit('updateInspection',res.data)
        this.$store.commit('updateInspection',{total: res.total})
        this.$store.commit('updateOptions',res.options)
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
      actionDecline () {
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
      },
      actionProceed () {
        this.$router.push('/final/1/' + this.$route.params.id)
      }
    },
    components: {
      b1Button,
      countdown,
      priceEditable
    },
    watch: {
      'offer.onsitePhysicalValuation' (newVal, oldVal) {
        if(oldVal) {
          axios.post(urlOfferUpdateValuation, qs.stringify({
            id: this.$route.params.id,
            onsitePhysicalValuation: this.offer.onsitePhysicalValuation,
            averageTotalForCarType: this.minPrice,
            maxTotalForCarType: this.maxPrice
          }))
          .catch(e => {
            console.error(e)
          })
        }
      }
    },
    computed: {
      minPrice () {
        return Math.min(this.offer.averageTotalForCarType, this.offer.onsitePhysicalValuation);
      },
      maxPrice () {
        return Math.max(this.offer.maxTotalForCarType, this.offer.onsitePhysicalValuation);
      },
      hasReview () {
        return this.offer.reviewPrice > 0
      },
      previousOffer () {
        return this.offer.onsitePhysicalValuation - this.offer.approximateExpenditure
      },
      profitAverage () {
        return this.currentTotal - this.minPrice
      },
      currentTotal () {
        return this.hasReview ? this.total : this.previousOffer
      },
      comparisonCalc () {
        return 100 - (((this.maxPrice - this.currentTotal) / ( this.maxPrice - this.minPrice )) * 100)
      },
      styleComparisonNeedle () {
        return (this.comparisonCalc >= 0 && this.comparisonCalc <= 100) ? {left: this.comparisonCalc + '%'} : {display: 'none'}
      },
      styleComparisonExtra () {
        return (this.comparisonCalc > 0 && this.comparisonCalc <= 100) ? {left: (this.comparisonCalc - 15) + '%'} : {display: 'none'}
      },
      styleBarExtra () {
        return this.comparisonCalc >= 0 ? {width: Math.min(100, this.comparisonCalc) + '%'} : {display: 'none'}
      },
      inspection () {
        return this.$store.state.inspection
      }
    }
}
</script>

