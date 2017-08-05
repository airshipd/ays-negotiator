// *************************************
//
//   AYS Image Upload
//   -> Upload images one at a time
//
// *************************************
$(function(){
  var $wrapper = $("#image-upload");
  if (!$wrapper) return;
  var currentInput = 1;
  function setPreviewImage(file, inputNumber) {
    var reader = new FileReader();
    // read the image file as a data URL.
    console.log(file)
    reader.readAsDataURL(file);
    reader.onload = function (e) {
      // get loaded data and render thumbnail.
      $('#preview-image-'+inputNumber)
        .attr('src', e.target.result)
        .removeClass('visuallyhidden');
    };
  };

  $('#upload-trigger').click(function(){
    $('#image-upload-'+currentInput).trigger('click');
  });

  $('.image-upload__input').change(function(){
    var $this = $(this);
    setPreviewImage($this[0].files[0],$this.data('inputnumber'));
    currentInput++;
  })
});
