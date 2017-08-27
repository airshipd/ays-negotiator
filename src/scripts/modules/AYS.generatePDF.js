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
  var pageMargin = 10; // mm
  var pageHeight = doc.internal.pageSize.height;
  var content_width = pageWidth - pageMargin * 2;
  var fontSm = 10;
  var fontMd = 14;
  var fontLg = 16;
  var spaceSm = 8;
  var spaceLg = 16;
  var _y = pageMargin + spaceSm;

  // title
  doc.setFontSize(20);
  doc.textAlign('Terms & Conditions', {}, pageMargin, _y);
  _y += spaceLg;

  // label row 1
  doc.setFontSize(fontSm);
  doc.textAlign('Make', {}, pageMargin, _y);
  doc.textAlign('Year', {}, content_width / 2, _y);
  _y += spaceSm;

  // content row 1
  doc.setFontSize(fontLg);
  doc.textAlign($('input#make-1').val(), {}, pageMargin, _y);
  doc.textAlign($('input#year-1').val(), {}, content_width / 2, _y);
  _y += spaceLg;

  doc.setFontSize(fontMd);
  // contract content
  $('.terms__content > p').each(function() {
    var lineHeight = px2mm(doc.getLineHeight(paragraph));
    var paragraph = $(this).text();
    var lines = doc.splitTextToSize(paragraph, content_width);
    var offset = lines.length * lineHeight;
    doc.text(pageMargin, _y, lines);
    _y += offset + spaceSm;
  });

  doc.setFontSize(fontLg);
  doc.textAlign($('input#make-1').val(), {}, pageMargin, _y);
  doc.textAlign($('input#year-1').val(), {}, content_width / 2, _y);
  _y += spaceLg;

  console.log(_y);
  doc.save('ays-contract.pdf');
});
