'use strict';

window.n = window.n || {};


n.init = function() {

  $('#damageAndFaults').characterCounter();
  $('select').material_select();
  $('.datepicker').pickadate({
    format: 'yyyy/mm/dd',
    formatSubmit: 'yyyy/mm/dd H:i:s',
    hiddenName: true
  });

}

//main body function go here
$(function(){
  n.init();
});
