// *************************************
//
//   AYS Image Upload
//   -> Upload images one at a time
//
// *************************************
$(function() {
  var $wrappers = $('.image-upload');
  if (!$wrappers.length) return;

  $wrappers.each(function() {
    var $wrapper = $(this);
    $wrapper.find('.image-upload__trigger').click(function() {
      var $node = cloneDomTemplate($wrapper);
      $wrapper.append($node);
      $node.find('.image-upload__input').trigger('click');
    });
  });

  function cloneDomTemplate($el) {
    var clone = $el
      .find('[template]')
      .clone()
      .removeAttr('template');

    console.log(clone);
    return $el
      .find('[template]')
      .clone()
      .removeAttr('template');
  }

  function setPreviewImage(file, $node) {
    var reader = new FileReader();
    // read the image file as a data URL.
    reader.readAsDataURL(file);
    reader.onload = function(e) {
      // get loaded data and render thumbnail.
      $node
        .show()
        .find('.image-wrapper img')
        .attr('src', e.target.result);
    };
  }

  $(document).on('change', '.image-upload__input', function() {
    var $input = $(this);
    var $complex = $input.closest('.image-upload__complex');
    setPreviewImage($input[0].files[0], $complex);
  });

  $(document).on('click', '.image-upload__remove', function() {
    $(this)
      .closest('.image-upload__complex')
      .remove();
  });
});
