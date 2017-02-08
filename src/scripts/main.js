'use strict';

window.n = window.n || {};




n.init = function() {


$.datepicker.setDefaults({
  regional: 'au'
})
//setup jquery datepicker
$('.input-datePicker').datepicker();

}

//main body function go here
$(function(){
  n.init();
});
