// *************************************
//
//   AYS Signature
//   -> Signature capture
//
// *************************************
$(function(){
  var $wrapper = $("#signature-pad");
  if (!$wrapper) return;

  var $clearButton = $wrapper.find("[data-action=clear]");
  var $savePNGButton = $wrapper.find("[data-action=save-png]"); $wrapper.find("[data-action=save-svg]");
  var canvas = $wrapper.find("canvas")[0];
  var signaturePad = new SignaturePad(canvas);

  $clearButton.on("click", function (event) {
    signaturePad.clear();
  });

  $savePNGButton.on("click", function (event) {
    if (signaturePad.isEmpty()) {
      alert("Please provide signature first.");
    } else {
      console.log(signaturePad.toDataURL());
    }
  });

  // to correctly size canvas
  function resizeCanvas() {
    var ratio =  Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear(); // otherwise isEmpty() might return incorrect value
  }


  resizeCanvas();
  $(window).resize(function(){
    resizeCanvas();
  });

});
