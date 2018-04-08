<template>

    <li @click.stop="toggleRowActive" :class="itemClass(inspection.status)">
        <div class="row">
            <div class="col title">
                {{ inspection.title }}
                <span v-if="inspection.inspectionDate && !isSales && !isNegotiator">({{ moment(inspection.inspectionDate).format('h:mm A') }})</span>
                <span v-if="inspection.inspectionDate && (isSales || isNegotiator)">({{ moment(inspection.inspectionDate).format('D/M/YYYY') }})</span>
            </div>
            <div class="col status">{{showProperStatus(inspection)}}</div>
        </div>
        <div class="row">
            <div class="col address">{{inspection.address}}</div>
            <div :class="bottomClass"><span v-if="inspection.status === 'finalized'">Report</span><i class="material-icons">keyboard_arrow_right</i></div>
        </div>
        <div class="click-wrapper" @click="goToAction(inspection)"></div>
        <span class="new badge blue badge-rescheduled" data-badge-caption="" v-show="inspection.rescheduled == 1">Rescheduled</span>
        <span class="new badge blue badge-tag" data-badge-caption="" v-show="inspection.driveIn == 1 && (isAdmin || isSales)">Drive-In</span>
        <span class="new badge blue badge-tag" data-badge-caption="" v-show="inspection.localMech == 1">Local Mech</span>
    </li>

</template>

<script>
    import moment from 'moment'

    export default {
        name: 'list-items',
        props: ['inspection', 'action', 'active', 'index'],
        mounted() {
        },
        data() {
            return {
                moment,
                isSales: window.isSales,
                isAdmin: window.isAdmin,
                isNegotiator: window.isNegotiator,
            }
        },
        methods: {
            showProperStatus(inspection) {
                let theStatus = ''
                switch (inspection.status) {
                    case 'UpComing':
                        theStatus = inspection.pending ? 'Pending' : 'Up Coming';
                        break;
                    case 'finalized':
                        theStatus = 'Finalized'
                        break;
                    case 'Rejected':
                    case 'Accepted':
                    case 'Submitted':
                        theStatus = inspection.status
                        break;
                    default:
                        theStatus = 'No Status'
                }
                return theStatus
            },
            toggleRowActive() {
                this.$emit('newactive', this.index);
            },
            goToAction(inspection) {
                if (inspection.status === 'finalized') {
                    window.location.href = '/report/' + this.inspection.id
                } else if (inspection.status === 'Rejected') {
                    if (window.isNegotiator) {
                        this.$router.push('/inspection-details/' + this.inspection.id)
                    } else {
                        this.$router.push('/final/1/' + this.inspection.id)
                    }
                } else if (inspection.status === 'UpComing' && inspection.pending) {
                    this.$router.push('/pending-inspection/' + this.inspection.id)
                } else if (inspection.status === 'Unsuccessful' || inspection.status === 'Submitted' && window.isNegotiator) {
                    this.$router.push('/inspection-details/' + this.inspection.id)
                } else if (inspection.status === 'Submitted' && !window.isNegotiator) {
                    this.$router.push('/offer/' + this.inspection.id)
                } else {
                    this.$router.push('/inspection/' + this.inspection.id)
                }
            },
            itemClass(status) {
                let obj = {
                    inspection: true,
                    active: this.active,
                    'z-depth-1': this.active
                }
                obj[status] = true

                return obj
            }
        },
        computed: {
            bottomClass() {
                return {
                    col: true,
                    distance: this.inspection.status !== 'finalized',
                    report: this.inspection.status === 'finalized'
                }
            },
        },
    }
</script>
