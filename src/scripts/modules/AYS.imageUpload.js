// *************************************
//
//   AYS Image Upload
//   -> Upload images one at a time
//
// *************************************
$(function(){
  var $wrapper = $("#image-upload");
  if (!$wrapper) return;

  var fileCounter = 0;

  function cloneDomTemplate() {
    return $wrapper.find('#input-template').clone().attr('id','');
  }

  function setPreviewImage(file, $node) {
    var reader = new FileReader();
    // read the image file as a data URL.
    reader.readAsDataURL(file);
    reader.onload = function (e) {
      // get loaded data and render thumbnail.
      $node
        .show()
        .find('.image-wrapper img').attr('src', e.target.result);
    };
  };

  $(document).on("click",".remove-file",function(){
    var inputNumber = $(this).data('inputnumber');
    $('#preview-image-'+inputNumber).attr('src','');
    $('#image-upload-'+inputNumber).val('');
  });

  $wrapper.find('#upload-trigger').click(function(){
    var $node = cloneDomTemplate();
    $wrapper.append($node);
    $node.find('.image-upload__input').trigger('click');
  });

  $(document).on("change",".image-upload__input", function(){
    var $input = $(this);
    var $complex = $input.closest('.image-upload__complex');
    setPreviewImage($input[0].files[0], $complex);
  });

  $(document).on("click",".image-upload__remove", function() {
    $(this).closest('.image-upload__complex').remove();
  });
});
