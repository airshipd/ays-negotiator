// *************************************
//
//   AYS Finalize
//   -> Scripts that fire on finalize form
//
// *************************************
$(function(){
  var $wrapper = $(".form-finalize");
  if (!$wrapper) return;
  // sync content for all inputs with the same name
  $('input').on('keyup',function(){
    var $this = $(this);
    var name = $(this).attr('name');
    var $sameName = $("[name='"+name+"']").not($this);
    $sameName.val($this.val());
  });
});
