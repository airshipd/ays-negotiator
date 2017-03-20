'use strict';

window.n = window.n || {};


n.init = function() {

  $('#date').inputmask('99/99/9999');

  $('#damageAndFaults').characterCounter();
  $('select').material_select();
  $('.scrollspy').scrollSpy({scrollOffset: 20});
  $('.datepicker').pickadate({
    format: 'yyyy/mm/dd',
    formatSubmit: 'yyyy/mm/dd H:i:s',
    hiddenName: true
  });

  $(".countdown").jCounter({
    customDuration: 60*6,
    callback: function() {
      $('.time-remaining').hide();
      $('.text-offer').show();
    }
  });

}

//main body function go here
$(function(){
  n.init();
});
