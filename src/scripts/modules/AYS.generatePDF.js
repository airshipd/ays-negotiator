// *************************************
//
//   AYS Generate PDF
//   -> Generate a PDF version of the Contract, depends on the jsPDF library
//
// *************************************
(function(API) {
  API.addText = function(txt, x, options) {
    var options = options || {};
    var lines = this.splitTextToSize(txt, this.settings.contentWidth);
    // if there are more than 1 lines needed
    if (lines.length > 1) {
      var lineHeight = px2mm(this.internal.getLineHeight(txt));
      for (var i = 0; i < lines.length; i++) {
        var new_y = this.settings._y + lineHeight;
        // if the new_y will exceed the page height, add a new page and reset _y
        if (new_y >= this.settings.contentBottomY) {
          this.addPage();
          this.settings._y = this.settings.marginY;
          this.text(x, this.settings._y, lines[i]);
          this.settings._y += lineHeight;
        } else {
          this.text(x, this.settings._y, lines[i]);
          this.settings._y = new_y;
        }
      }
    } else {
      this.text(x, this.settings._y, txt);
    }
  };
})(jsPDF.API);

var px2mm = function(pixel) {
  // px to inches
  var inches = pixel / 72;
  return inches * 25.4;
};

$(function() {
  var doc = new jsPDF('p', 'mm', 'a4');
  doc.settings = {};
  doc.settings.pageWidth = 210; // mm
  doc.settings.marginX = 10; // mm
  doc.settings.marginY = 16; // mm
  doc.settings.contentBottomY =
    doc.internal.pageSize.height - doc.settings.marginY;
  doc.settings.contentWidth = doc.settings.pageWidth - doc.settings.marginX * 2;
  doc.settings._y = doc.settings.marginY;

  // some number variables
  var fontSm = 10;
  var fontMd = 14;
  var fontLg = 16;
  var spaceSm = 8;
  var spaceMd = 12;
  var spaceLg = 16;

  var xStartLeft = doc.settings.marginX;
  var xStartMid = doc.settings.contentWidth / 2;
  // title
  doc.setFontSize(20);
  doc.addText('Terms & Conditions', xStartLeft);
  doc.settings._y += spaceLg;

  // // label row 1
  doc.setFontSize(fontSm);
  doc.addText('Make', xStartLeft);
  doc.addText('Year', xStartMid);
  doc.settings._y += spaceSm;

  // content row 1
  doc.setFontSize(fontLg);
  doc.addText($('input#make-1').val(), xStartLeft);
  doc.addText($('input#year-1').val(), xStartMid);
  doc.settings._y += spaceLg;

  // label row 2
  doc.setFontSize(fontSm);
  doc.addText('Model', xStartLeft);
  doc.addText('Kilometres', xStartMid);
  doc.settings._y += spaceSm;

  // content row 2
  doc.setFontSize(fontLg);
  doc.addText($('input#model-1').val(), xStartLeft);
  doc.addText($('input#kilometres-1').val(), xStartMid);
  doc.settings._y += spaceLg;

  // content row 3
  doc.addText('I, ' + $('input#termsCustomerName').val(), xStartLeft);
  doc.settings._y += spaceMd;

  // content row 4
  doc.addText('of, ' + $('input#termsCustomerAddress').val(), xStartLeft);
  doc.settings._y += spaceMd;

  // content row 5
  doc.addText(
    'hereby agree to sell my car to Car Buyers Australia Pty Ltd for the amount of:',
    xStartLeft
  );
  doc.settings._y += spaceMd;

  // content row 6
  doc.addText('$ ' + $('input#termsAgreedPrice').val(), xStartLeft);
  doc.settings._y += spaceLg;

  doc.setFontSize(fontMd);
  // contract content
  $('.terms__content > p').each(function() {
    doc.addText($(this).text(), xStartLeft);
    // add gap for each paragraph
    var new_y = doc.settings._y + spaceSm;
    // if the new_y will exceed the page height, add a new page and reset _y
    console.log(new_y);
    if (new_y >= doc.settings.contentBottomY) {
      doc.addPage(new_y);
      doc.settings._y = doc.settings.marginY;
    } else {
      doc.settings._y = new_y;
    }
  });

  // bottom label row 2
  doc.setFontSize(fontSm);
  doc.addText('Model', xStartLeft);
  doc.addText('Kilometres', xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 2
  doc.setFontSize(fontLg);
  doc.addText($('input#model-1').val(), xStartLeft);
  doc.addText($('input#kilometres-1').val(), xStartMid);
  doc.settings._y += spaceLg;

  // bottom label row 3
  doc.setFontSize(fontSm);
  doc.addText('Customer Name', xStartLeft);
  doc.addText('AreYouSelling Rep (Witness) Name', xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 3
  doc.setFontSize(fontLg);
  doc.addText($('input#customerName-3').val(), xStartLeft);
  doc.addText($('input#repName-1').val(), xStartMid);
  doc.settings._y += spaceLg;

  doc.save('ays-contract.pdf');
});
