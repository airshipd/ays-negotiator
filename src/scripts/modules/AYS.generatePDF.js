// *************************************
//
//   AYS Generate PDF
//   -> Generate a PDF version of the Contract, depends on the jsPDF library
//
// *************************************
(function(API) {
  API.textAlign = function(txt, options, x, y) {
    options = options || {};
    // Use the options align property to specify desired text alignment
    // Param x will be ignored if desired text alignment is 'center'.
    // Usage of options can easily extend the function to apply different text
    // styles and sizes

    // Get current font size
    var fontSize = this.internal.getFontSize();

    // Get page width
    var pageWidth = this.internal.pageSize.width;

    // Get the actual text's width
    // You multiply the unit width of your string by your font size and divide
    // by the internal scale factor. The division is necessary
    // for the case where you use units other than 'pt' in the constructor
    // of jsPDF.

    var txtWidth =
      this.getStringUnitWidth(txt) * fontSize / this.internal.scaleFactor;

    if (options.align === 'center') {
      // Calculate text's x coordinate
      x = (pageWidth - txtWidth) / 2;
    } else if (options.align === 'centerAtX') {
      // center on X value

      x = x - txtWidth / 2;
    } else if (options.align === 'right') {
      x = x - txtWidth;
    }

    // Draw text at x,y
    this.text(txt, x, y);
  };
  /*
            API.textWidth = function(txt) {
                var fontSize = this.internal.getFontSize();
                return this.getStringUnitWidth(txt)*fontSize / this.internal.scaleFactor;
            };
        */

  API.getLineHeight = function(txt) {
    return this.internal.getLineHeight();
  };
})(jsPDF.API);

px2mm = function(pixel) {
  // px to inches
  var inches = pixel / 72;
  return inches * 25.4;
};

$(function() {
  var doc = new jsPDF();
  var pageWidth = 210; // mm
  var marginX = 10; // mm
  var marginY = 16; // mm
  var pageHeight = doc.internal.pageSize.height;
  var content_width = pageWidth - marginX * 2;
  var fontSm = 10;
  var fontMd = 14;
  var fontLg = 16;
  var spaceSm = 8;
  var spaceMd = 12;
  var spaceLg = 16;
  var _y = marginY;

  // title
  doc.setFontSize(20);
  doc.textAlign('Terms & Conditions', {}, marginX, _y);
  _y += spaceLg;

  // label row 1
  doc.setFontSize(fontSm);
  doc.textAlign('Make', {}, marginX, _y);
  doc.textAlign('Year', {}, content_width / 2, _y);
  _y += spaceSm;

  // content row 1
  doc.setFontSize(fontLg);
  doc.textAlign($('input#make-1').val(), {}, marginX, _y);
  doc.textAlign($('input#year-1').val(), {}, content_width / 2, _y);
  _y += spaceLg;

  // label row 2
  doc.setFontSize(fontSm);
  doc.textAlign('Model', {}, marginX, _y);
  doc.textAlign('Kilometres', {}, content_width / 2, _y);
  _y += spaceSm;

  // content row 2
  doc.setFontSize(fontLg);
  doc.textAlign($('input#model-1').val(), {}, marginX, _y);
  doc.textAlign($('input#kilometres-1').val(), {}, content_width / 2, _y);
  _y += spaceLg;

  doc.setFontSize(fontMd);
  // contract content
  $('.terms__content > p').each(function() {
    var paragraph = $(this).text();
    var lines = doc.splitTextToSize(paragraph, content_width);
    var lineHeight = px2mm(doc.getLineHeight(paragraph));
    for (var i = 0; i < lines.length; i++) {
      var newY = _y + lineHeight;
      if (newY >= pageHeight) {
        doc.addPage();
        _y = marginY;
        doc.text(marginX, _y, lines[i]);
        _y += lineHeight;
      } else {
        doc.text(marginX, _y, lines[i]);
        _y = newY;
      }
    }
    // add gap for each paragraph
    _y += spaceMd - lineHeight;
  });

  // label row 2
  doc.setFontSize(fontSm);
  doc.textAlign('Model', {}, marginX, _y);
  doc.textAlign('Kilometres', {}, content_width / 2, _y);
  _y += spaceSm;

  // content row 2
  doc.setFontSize(fontLg);
  doc.textAlign($('input#model-1').val(), {}, marginX, _y);
  doc.textAlign($('input#kilometres-1').val(), {}, content_width / 2, _y);
  _y += spaceLg;

  doc.save('ays-contract.pdf');
});
