'use strict';

window.n = window.n || {};


n.init = function() {

  $('#damageAndFaults').characterCounter();
  $('select').material_select();
  $('.scrollspy').scrollSpy({scrollOffset: 20});
  $('.datepicker').pickadate({
    format: 'yyyy/mm/dd',
    formatSubmit: 'yyyy/mm/dd H:i:s',
    hiddenName: true
  });

  $(".countdown").jCounter({
    customDuration: 60*(Math.floor(Math.random() * 7) + 2 ),
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
