<template>

  <section class="section-report">

    <div class="report">
      <!-- Report Meta -->
      <div class="row report-meta">
        <div class="col">
          <h3>Inspection Done By:</h3>
          <p>{{report.mechanicName}} / {{report.jobTitle}}</p>
        </div>
        <div class="col">
          <h3>Prepared For:</h3>
          <p>{{report.customerName}}</p>
        </div>
      </div>

      <!-- Report Comparison -->
      <div class="row">
        <div class="col m12 report-main">
          <h3>Comparison</h3>
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

      <!-- Report Issues -->
      <div class="row">
        <h3>Issues</h3>
        <div class="col m9 report-condition">
          Your car is in better condition than the average {{report.make}} {{report.model}} we buy, nice one!
        </div>
        <div class="col m3 report-grade">
          Overall <span>{{report.grade}}</span>
        </div>
      </div>

      <div class="row report-issues">
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
        {{report.estimation}}
      </div>
      <div class="divider offer-valuation">
        <h3>On-site Valuation</h3>
        {{report.valuation}}
      </div>
      <div class="divider offer-repairs">
        <h3>Repair Needs</h3>
        <span class="discounted">{{report.discount}} <span>Discounted</span></span>
        <p>available if you accept today</p>
      </div>
      <div class="divider offer-previous">
        <h3>Previous Offer</h3>
        {{report.discount}}
      </div>
      <div class="divider offer-final">
        <h3>Final Offer</h3>
        {{report.discount}}
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

  export default {
    name: 'p-4-report',
    props: [],
    mounted () {

    },
    data () {
      return {
        report: {}
      }
    },
    methods: {
      getIssueIconClass (item) {
        return 'icon-'+item.type
      }

    },
    components: {
      // B1Button
    },
}
</script>

