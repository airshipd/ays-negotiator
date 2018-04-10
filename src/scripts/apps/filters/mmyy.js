/**
 * Format date as "mm/yy"
 */
import Vue from 'vue'
import moment from 'moment'

Vue.filter('mmyy', function (date) {
    if (!date) {
        return date;
    }

    return moment(date, 'DD/MM/YYYY').format('MM/YY');
});