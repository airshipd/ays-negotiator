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
      for (var i = 0; i < lines.length; i++) {
        this.checkOrUpdatePaging();
        this.text(x, this.settings._y, lines[i]);
        var lineHeight = px2mm(this.internal.getLineHeight(txt));
        this.settings._y += lineHeight;
      }
    } else {
      this.checkOrUpdatePaging();
      this.text(x, this.settings._y, txt);
    }
  };

  API.checkOrUpdatePaging = function(elementHeight) {
    var elementHeight = elementHeight || 0;
    if (this.settings._y + elementHeight >= this.settings.contentBottomY) {
      this.addPage('p', 'mm', 'a4');
      this.settings._y = this.settings.marginY;
    }
  };
})(jsPDF.API);

function px2mm(pixel) {
  // px to inches
  var inches = pixel / 72;
  return inches * 25.4;
}

function toDataURL(src, callback) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL();
    callback(dataURL);
  };
  img.src = src;
}

var logoDataString =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOUAAABzCAYAAABn9sVIAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7J15eFXVubjfb+1zTk4mSEgI86Qgs5aGBMcKjrcOFYVQh+twbYtVCGq1w61tPR3ur72t1iGAiq3a1lqbAM5Yb7XgiAwRREBRRJCZJISQ8Zyz9/p+f5wkZDiBgAGE5n0eHmBPa52997f2Wt8odHLMkZdX6KzvSTfHpZsYpwdq+4kjvbF0VyFNlCwVEdA0FF+8ayiERaQy9m+1BrYg1AIlYHaibPFwS3yOu2tJ+sclhEL2iP7If2PkaHegk/YxLn9BF0+rv2rUnK+iuaj2AzIQyTyMze4Fdgp8YlWe1mj45eI5V5cexvY6oVMov/R85bZn0vye+y1Rc5WiySA7QVVhjyDRts+0PhVJE0uKiKQomgl0ARJaH6vbBB5VpDfwnfjXExf0QzXyu+6aWPhywUXhDvh5ncShUyi/pOTlFTqf9TATBUIK2wzmDz6X1zXRrQRY3HVteL9TylDIjN94diBq9vpt17C/LuoFE1wC6neSrJrbqBc+gU0evkuLZ0784Ku3PD3cEd8ShCpF8hAvqp6TLMYGjZozVfT7gAIvYqO3LZt91eYjcCv+7egUyi8hudOfH2Q1/FtBEsTo75Iqq5YteuK/6jri2jm3FPZEZBEiQwEPkf9YVjDpVYAzfvBcaqTGfRU0B+GyZQWTX2g4L3vqcr/j3/iwCjeCKGo/tqrfLp495W1igtpJB2GOdgc62cf40MJg7vSifIjMdBwze+Aue/nSgrw3O0ogAcE436kXSBAeXpbxwb8adr7928sqVfQtQATyQiFtfD+K54yNWp//tyibwX6ImJMcY17OmTY3f3woFFeZ1Mmh0SmUXwZCIZM9vXB0dWnp38Ek7pakK5Y8OGlhUdEUryObGTdj7mDQmwEQ2Wgd+Z9WU2DLayiqKuNfLn++e9Ndy9NXfIKRV1TlCUFfViUZ4YGq0lEFg/MfjLNW7eRQ6BTKo8xptxcm5pSNuslgHkR5cGnBFb9bfxiUKONDIZ9VbgV6AZ4ovyq+f9KOlsd5yBpEtoD2szaa22xnKGQF+2cRTo3i/44aFgEIclO67TVzTH5hd9DOJdEXpFMojxKn3V6YOC5/3qmu6zyKcq6rcsOyWXmvIXJY1meVpSOGo1wT+5+8nmS9vxNnLdi1+wdbBf0QQFUn5+UVOk33J3m6AsUvXrgXKj8FKkAFkW/51LydO33u98+48bnUw/Eb/l3oHNWOEmPz594rqjch5r5wQspvVt1zYfXhait76iN+J5D5B0WvA0B4aFnG6unjynJTwk7YpO3ZU9d03Zozfe6PgF8Du0TNiKW73D2nZdDTdZwTBR1r4XqReqcEYTBKoElzHkiRcXy3LXngsp2H6zcdz3Qu0I8w2VMf8UsgY7ook1Wdbw/a6RYVFV3YoWvHljiBjFMUndK4Qbkmp2TUWCs1Sb4opjo5pXxcfuF3lhRMWQuANSsxtg7IUtGHcns6ma7VQYjto4i/2Uje+rvugH7Tuu4m0P+Gw/PlP57p/FIeEVTG5c/vo0KOWm4A/TqwR2CFQjmwV2EXUGuQHUCtWtlt0bDjyG7Hc6tdqCp3UsoPfr2pkpM/9/eo3Lbfo5SFGH1VLGchMgrozRdb3qy1CQlnF997aacH0EHSKZSHiXH5T3axBM8WlTNBz1YYTMyjxn/AkxVFiAIeiisirqr1EIkCFtiuonWCbEOJiLJdDbUKJaB7jTWVVmw5ojUOVFk1zwMnHtYf3JqocRi75IHJq45wu8c8ndPXjkHGhxY6VWVlo4HzUM5T5XQgUVHnQCe3vhoC9es0icko0mz87CNNlJwqgDaMsGJVVAWxqKgX2300zBV+10o/oFMoD5JOoTxE8vIKnU/6+FMDUTvBil5cXVp2sUDPhv1HcSHVMOV04OhOhYzaAUex+WOWTqE8SLJ/WNjVqXHO3Kh6tT/qXqAimZ1rgPgIlBztPhyLdApl+5Ax05/r5dfolVrNDYqOAqTFlLKT5uxxrK442p04FukUygMwLv/JLqrBq5Xo7SoMoVM5Fh+RjSibQM+u37CJMLuPbqeOTTqFcj/kTpufYdU+AXyd+jVaJ3GxqtzqGP3QWpYCacCmvnupONodOxbpdLNrExWLvRG4hE6BPBDbNTLg5SrXbhdYF9tk3+xoh/p/FzqFsg3GzZg3WIz84Gj349hA3imeMzbaPat7nQq7gO2izvNHu1fHKp1CGRcVq/Igqocz/81xhP0AYFFogotSo2ipF3U7/V4Pkc41ZRxOvvMvSdQlX3gEmvLqc99Ug64D+RTVjQjbRZwq63mJGHOpoP/Bl3gKLcZsBxicvyABrclAqSieM6VzPXmIdAplcwTQxOqkE61z2OICw6KsU6P/EmveEEdXL9luN9DW+iukj+aUzX8E1W8fpv58cep73iMxGojUkGaMbD26HTq26RTKJoydXnS2I2a9p95A6fiZvQVdI6p3J3Xv/sKi0AS3PSedtqvoBNeYI/HVPmTUxAawmhpSfaoDUVl4tPt0LNMplPWcceNzqRGiv7aq68Fs6uDL1wF/8bvOT955+Ipd7T1pfGihr7qk7PdAvw7uT0fTF8Av7hgL3QTeOdodOpbpFMp6IknuRcBY4FSBdn3F2kmFKnd1N0l/ePnhgwu7qi7dPQnh4nYcWkMscXLPAx3YMWgUxEe9I4UoF47Lf/Jeq/pdQbYbn7PyyPTj+KRTKOsRdLDuux8ddV92IXrz8pmTnznYYN/Tbi/s5kb117RHQ668huhqkP8+1I4eGFHQLQpzDfKGwoPUf8EVzVFN+BdwikLRu2nvf374+nH80ymU9ahqeof6soqUgkxZVnDF6+09ZVz+gi64VUM8nznJjepkYGA7GlKMvoontYfRwPUu8LjPb19a3HXtdu6+W3NmPJOM2jsFBiuSAmQDn4rSOkNeJwdFp1A2IKamIwOuxNr/Xjorr5lAjgwVBgKlCZnGCfvE0lPEDMRygiDDVXW41ZqB4phEURJB2mkCUddY86En1t/B6uJahBdAHg0nVC9edc91+3IIhUIsQ58648bnn9eAlxjxy0AR7eaLuB8sfnjKto7txr8fnc7V9WRPnzvMoK8Rq6fREURovTaVJn8MMdvjF/2+1eLJKPxyEta+/IWuFMt4sA3kMet4fzhhG1s7XeWOPJ1C2YSc/LmXohQCwaPdl3ajVNZ0t5lJu33nHLpQah0q74lhpuOzzy6+b0ptx3ayk4Ohc/q6DwGpRTWKHENCKexaE5oSyZkx/2DPtEAZ8KyoPr50Vt7iju9cJ4dCp1DWMy7/yVSrOgvhGEskLLsA1LqBdjo8RIC1iDzpWuaumDWpo22ynXxBOoWynsSMPjU1ZWVLVI+tQGZBy2N/Oz33r6jSckQWirVPikl5bUnBRXuPUBc7OUg6hbKeRaEJbs4tz96FcQeAnHWs1MRQ2FP/r0RgC6qzBTNARS8hVjfkQ1SfsaKFhHd/VDznpv0Umu3ky0CnUDZh2eyJm8+8+cWJdU7454J+F+TAOVoPP25siqpxtcIa8+RBoLsiO8vNtt+vL5gRzs0vuk6RchtOWFw8pzMh8rFEp1C24K2HLikfH1r4vdpdu5+xonchnHt0eyTbQf8K/Gh/R6nSB7FV6wtmhAGWFuT9+Yh0r5MOpzPIOQ6LQhPcJbMnLUyurrxEjU4EXo3FPR4FRBeD1uzvkJF5hQERskSl073tOKDzS7kf6itRPQf6/NgZz4zE6pUSS6I1DDQIcrgHNVX0JYH9JjVO6RkJWg32BpYc5v50cgToFMp2Ibr8QVYDPwF+Mi5/Xl/PmjMF+zVEchEGoKSCdmx5ANUyv19f9CLmhrbUToImRNRJ8cFAkVhdyU6ObTqF8hBYUjBpC/B07I/KmOlP9/LjH60wBuQURMegZBJLtXiIaTw0KmJ+sfi+Sbtz8ot27kcZ3NfBdxIg4umGQ2urky8TnUL5hRFdMZNtwDbgFYhVabYugxQGqTXZiH4F5AQgHSUdIYXmtlAFKkH3oLIFdDGO82pSt/RXAcTqBm0zgkVGi+o1QHnER+ea8jjgmLDFHQ9kT30kicT0TLEmA9WuRkwyVjNV8BCzGc+tAK/MukN2FM8Z28yWeNp3C/u4PvM+kNHG5T2FF5bPnHz54f8lB0/21BeSnEB4hFpXAIwa60tN+Pjt315W2XBMzi2FPcE2ZliwxtQRKf+3tKt2fimPEMVzbqoBPq//c1CU+HeUpttebyDSltCJKP/3hTp4GDH+ul+oylSc2OtmVTVS6z4G3L7vIHkO8Q1v/K8SJZB+C/D3I93fo02nUB4DrC+YEc65ed6dOPo58DWgD0r3+jqWAB+hic8cxS7uH5GhQOo+L0BBVUe0OOhktHkggIjp3/T/uflFZ4HcoTAM1TUi3L+0IO/Nw9jzo0KnnfIYYdlDkzYsy1z9vXAw9Syf3w43vkgvz5oRAjlRn3PGstkX7zjafTycZE+fO0yVF1W5DGUoyBWq5ulTb5s//MBnH1t0fimPJUIhuwqqif0B+LfJQm7gWyBdmm/V3q5rpwA/PyqdOkx0CmUnxwpx02xKLD/QMUXutPkZKt43gBGoVFp4hejA9xoUfJ3T106OEWy8IGwL8skR78oXIOeWotNV7D/BnCVq1qlonaD3OIGND46++a/p0CmUnRwj2EjioygvAA0mkrDC323EO2a0s6dPmzcAI7MQ+QGqKxVNMpgyjMxASA46ge+PD4V8caev2VNfSPInuVmqXhe1JmZbioYrKsucbWuKpkQOpUPjQwuDlaVlAx0xCda4dVp7woaW9jiAvLxC5/OeTi9XnXRHrPHUtUSc0uLeH+z8sqUuHJf/ZBfPBHoZ6wsCCG5UrW/n0lmX7z7YPK9HhFDInL7j5MxIgCyjMU+jg32u4/Kf7CJeUh/rEADAUusE3M2HO69P8ZxLa06+85WrguGq8Yr2Vms3RhLr3lk1s0mWvQOQPXVeLydBsgCs4IWjtVs/eOia8oPtS/bUR5LESe9nfLHnrj6tTC7fu63eV7pNokZvVJVn95D4ZrrUvAA8omhfo0xRT25WQ1F4x4hZjc4D40MhX+WuEacaYyYDZwFZQOq+YF/ZW18V6u9Rv/O3lfdfvqdlo+Pyiy5Qy09VTL1rme61Kj82aodj5GZUhyIEQMIody+bNfmhhnNH3lKYkuT4LkPtNYgMRzUN1IBYkDJRuxr4Q1L3zH8cqA5H9tRH/BLodq9gxu7bqlZVZy6fNfnvbQlM7rT5l6jY7zfGUaoqoq8nZ2b+rLHNUMiMKxuda9HrUM4CeuzzeZUoUILyror+aXnm5DcISauBZNyMuUOspaCZ4kLtkvDe2p+s+kvrlyxnRtHpqPwClaR9W+3LA3fq/2tXtrlQyIwtHX2aCDeD5opKpmLrn5HsRflc4VlR39PLZk/c3PoCKuNunTfas1wvyrmI9EFtoP78OpRNiL7gEvjjipmXtUoxmTN97gvEiu/uuyL83/KZky9sckwttDSJ8IOlBZN/B7GcuFarHwfTq8lFNtho+LbiOVeXAozNn3uVqOQ3uUSJqHxf8foh5ttADtjuAILxFN2mwit+zz60ePaU9Qe6jdm3zetlotyA6BUC/RWt76+pErEbBHlcrKx00XtEpH6fjajq/yyfNeWfOfnzXkbsL2u66fKkUrNHRX4lVocg2q1ctk9J195/9cS9xwcw7tbnelSVRB9xDOcqtFg4N8ptF9C+CGf6PfvNU295+uZ3Z1/ZzAHaqrkS0TObpqUwoiepSG+BhKbJjkVotFONnTF/lFididozAB/acH7D8ZqmIicCF9aUlT31ldueuSPeoNBAqi89oRr5dn00/j6MpI68pejFNbOpannO+FDIV1OmP0TZ1/9YUv5eu3eU3w/syp76VKZTkvArK/aq5prAZo5RGQjDBMnLLZ0/T2597gdLHrismZbUWpkAemGz9B0i/ZKS/Q+wT7O6b5eVCQrnNk/3YfpuSA/cS6xkQZtkT13ud0o+C6nodJQuEMsk2ey5Cn1FOQ2JXj1m+nMXNxWs7KnL/SZh7g+tJ7cLdAOIPZ9m52eBjPUTvWrstPm3Lp91xT/316dDwUr1KFSuaH7POFUSAvcCpQCi8l+gpzU9T8X2QeUk0NSGk6DhHpAuykjXca7InV74raUzp/wrbuOhkBlbOupycfX/ITKExlG98f3soiq9FU4Fu0dEMvf1UzCYj4B/iuKpNb5YmTJRUdsHkYtV9Zr1M2eEc6bNDTiO3zMA1o1eIcJlrQUyLg6qZ3vG/8SY/MLuzXdpvLwvgwTajJ4Ym/9Mrlj7EujZHFgbHFTlRr/r/WH8DY+3nXEuq3sdSKsXQyyjg/CVeKdU7T55mNLSoA0gS1c9fHnJabcX9jGBwDxFp7ZWzcclWdFrrRd9+dTbnhnY7Ipo67W8qhCM/5M0zvFxrxEHE/jsVhV+BOy/z4IgJstPuPFZZU9d7ncCn/0BlRANArmfKygMF7F/ypk272vt6dvBIBrXsb/ZaKhonAwLkn3AZGiqAxXzt+xp874ab3dO2ajpIvI4cNIB0sT4EGlVaFhNbFaiytuIXtq/LEVAI9bR/wWeEjF3ZE8vHI1Ib0P4cwNgjKygscpge9Ecv8q05tvkoJIxZd82r5eo9xjQ/4AHN2diVXKX77a1c1FogivKE612COKI859xb6x630BbvXgRUfvk+FuKkt2IeQj4WhMvmvYgwBjPdeecfOefkw/ivA4h+9YX+gtyd7vjPlWLl87M29jwX5Ow6YeKXMPBRbr0QvT+3Gnz2/LTPWyIclAFlFqQZcT+nlCo2b0aO23++Si/RPWQsxyqxxYA6+cJlEvLtPobqtxBbWKpz29/IchLBqcA1eeXpH9cYgCWFEx6F6FhKuqBfg48iXI3qj+Nab20pVJGFPnm6d+dn3UQ/XOBMBBWYbeJ6k+BkS1/A7AalR+DuRHVvyqtppuOiN4Rc2KOT8RvFgIftdyuwpSRtxQ1E5DxNzweFJVL41xmU11i7cIqMde3Uf3KFVgC+msRfgcsJ97gpnJesDbpprb6erhw3Lqr4sx+oqAvI/JThYeBtfVZFTxUG9fbufnzT0G5g9YCWSHCY6A3gv4MdG2cpsdg7FUd/4u+EB6wBeSfCNuJ5b1tgZydvWvE6Q3/y502P0PE+y3xZhlCNcJriP4BdCmx1J1xERNrq/j+SdvFmG8qcpeIXiIJ4Wmea35kVW9GeTe5uvK3hEK2cbqoSkjguyr6F79Pixbfl9dMm5aTP+8nqP6yRXuDPb+eAByg5qIo8IYIv/Ms2yGKscbiOP/ct35sPHZucma36xaFJjRosh4fmz9vMqp/ApooOuitYi4CHovX4sr7L9+Tkz/vr637rOnJxvkG8FTDltouaSPxvJHNv4GiorYopSol2fXZadrCfKQQFuR7S3d6jzRUYR4ZKgwklTo/RPQnaL12EkAQhe+Ou/Wpvy554Ooj5oWjxoxueX8VFtbu1IlriiZFILaWrto1YiLG9KtFn2vosaq9hVg86D5EShF75dIH815r2HTmzS/ODDvhBaCnNmtH9dozbnzuT28/ti8S5Oih1YLcWb3TPramaErk5Dv/nJxQm3g/Yr7VctbkiPkG8BZAzMAv8ZY7K62VbxXPmvQeAKGQySkbORGVRznANH9pwRXvj7/h8VNrklPOA+0PZjc+3x+XPXDZuoZjGoVy+czJ84B5Tc6XM37wXEqkqibNGn8yscpLLfFZtcPb2NcEXeGKzVtRMKWkYUvutLnfU9WW8+/drnjTmghkrG8ZH8zPKR11I7FUHA0YMVxIG0IJYFXnGvR7IOkt+nMNTYTSU/dCEWkxPdFa6zh/i4g9S6CVf6UojyybNWl2021rQlMi40MLf11TUpatwmUtTjnBRgO5wAtt9bejEWyCtphtC/RPyjJDCIU+JBSyi0IhF5jb9Jhxtz6XZb3o+S0uZ0XtrKUF+wQSYonGsvOL7jYqr7RofWQkMdofWNNRv+fQkV8tzVw9h5kxk9qqe66rHjNt3q986AW0WDqpkAMwOP/BBFTy4lysBmv/q3j2lH01OEMhuwzmj80vGiYqv+QA9v9608mLbe1vpVg58+YX0+tM7ddE5KJIbXQMxt/XQHdU21DCtEPpIeb3KwomNwrk+NBCX1Vp2VktF2cClT7M3bnT5zYf3ktBkazWyYZlxPjQwmBLIW4kUvap+Lu9psLkppsVxp962zMD373/8o0n3/nnZBM2X9cW1xZhybIHL1+TM31+fpwkx1Hrs/fGa3JRaII7bsa8B9TqxTS/vw7CeRxBoVSVeGr+YcAruWWjnrL5c/+m4bLVLWMWrXVHA31anGdRRuZOn1vQup24irxkozKcoy+UJY7PebqljXvwLm/Lxh6yCqSlPqMnQHdfz0w3ql9tGXKs8NzypgLZdJ/RJ8WTHwNfSH/Q+NKMDy301ZSUXROW8AxBTgGc9lWG0x773S1U4mozF6k9e/ak+GFwqyvBAJRp8ZuNs9Vq0u4d5V2IlS9vRfGcm6I5+XP/jDKR5gKS6LruFOC3gXDSSai2mKKIYvVP40OLEmrKdEjLGbZAcXF63pa43QTcutK3TCBjLy2mMiIMDoXULCid18aZHYyV+Ri9jZYFi4Q+qnxflO8SyHht3K3z712SvuqdhhdX1A5XJNDiaj4VmcxBYI09GH3D4aIsWuNrZQIrKprijZ0+d0tbWrtIxOlh0KxWaj3Rf7TVUPEDUz7PmT73CwdlG4DB+QsSakrLClT0UdCvchDaNlHZvxnDUuJXaXZT/JFoEGilOj4EEpKCTQ3qrfH57NtAy4RSIsjV40MLfUa5qLUyxO4RU/dM5baShDhTbFT5nFDbQ1bsy6PrWm5XIW1+1V8S451zOFg264rlorT6sjUipApMtJ73Uk7JqJ+MzCsMAGgss/pxj9DasaMBY+gWT9NurB52X1sDkK61dylMPRwZwUUk7DqtNZLSAX63KtTaqO5XkbD4vim7QYvi7Dqptqz0HET+o/Uumbuk4D/rzTtxkuMIew6USUWQ1v1SEdj/xKJDEVEnYO9WuI99PqPxDuyC6E+SeshPWpoEvggq5rirbamYw16DxYzLf3YEqjOIIyQKH9Y/0GtV7QXAlymQ1gq8m9R9VcUBD0SfjZU7b0aiVflvVR3b8ngj0qbyKIZ2b601bnFE6zUZqlrnpVTEFw5jElp5IHUAi++bUquRsh+qYSIiy9o+UvyCmZ5TPjq7QxpWdtWbCo4rxNiBh7sNo+pejtC1xXYX5JcaSRi7fObk7y2bOfnJ5d3XvsZ+bDEHgy+BiApxHIH1lzWZNqGdfxIH7rQ31GsP90vxzCmrURsvbcR4WheIXVlG4gqAioSUOtDtrU+T7PE/X9TmFL/edntCq7OErWtCbTh+W01wPRvXpUeQL7Q2K55zU3T5g5MX2HDpGRg9Q+GP0tr2i6LpuHYSYsriXKZE1GS29/nYaFnf5QWTV3yRfh9NPE+2EsfmrDinxjkciCX/kg6IUfYpmt1qKibyUY3n/XbNnEsb/Sqzt/Vy8GtSvNncwRKpLq80/oyPEYa2aDgP9FdtvrgtOAi1niLyOMrFQEsFRvMeKH9ZP/OiMMD6govCY6cXfSTQ0jzQv6qk7AJgQbxrRP32SizB1jPcmMLLQonEHvg+wRZSjZWBQLMX+bTbCxPdKCcf6Ae2h3ot6zvAO7nT5z4MPE/L9aPhFIu9z8QcCva9YEJXNfbcNaEphR3Rly876rilqNkADGm+w16XPbXwnuI5U1rN0NSRy1C+8GzHiEhaq62qdSNKaOY8IP5uk+L59R0KxXNuiqqReM6/w5LKnF8Mzl/Qpq9s9tRH/NlTC1t+2Q9IsmcXAvtPVqxUGi/arCSyQV4izogpwv8bffOL6S23Z0+fOwzl+3GUBGWe9RYCOCJbNebd1Lx5o1eODBXuGzRCIeO5vjzQM/fb7zbIyyt0cqcXDjrt9sJWBu2lMycvF+StViepJBvP/VBga/PtBMRKaNyMufup36kyLv/JLg0Ko2OZFRlryxTeaL1H+puAeeArtz3TKDd5eYXO2PxnckXNzzjk5Nv78GG1rPXXT0/c2NNclD218A1fYkLQcyMThP1o8Q4B63kvOka+D9K8xJvq99OpGTwuv2iOi+9Tq3W1Pn8gaKymqMsYRS9D6JOb//TUpQVXvt/e9hbNnlJV7+HzC9p6qQwvR6N7m72MEZ+zxO96y4AW0xY5OeiEn8mZNu9nrvE+NI7jc6I2W+HXQN/WF5d/iluxHsD4vPdt1FQQC49r8tu5NKnM+UXu9LlzUePXEp2E2Jva7bvags96yAWCzHejsj5n+tw/oLwqmB1etE7w+YZZNDfOjdi8bPZVm3Py5y5Aubl593S4evwjZ9rcB8SY1wUtA3BVUxxsb5X5F1hNOC+pp3k1L6/wrnaFlX1ZCYWs3FL0GCJT4ji0X+d3vZNzpxc9D1KxUWSEqL0ctEP8fX2I8w5qJzUf2SUd1SdNwKy3NposIoPpgBGgKe9lrd2QWzryUYWf0lzJZIBJVuVyg1dq8FcStSkWSUNIaAy9UWcS0G6hBBArhSp6J7RaQwN4RvSpZS0M6Svvv3xPzvR594M+QbP1pwpwNsI/HDUbjat+FRkAxNNgb1XR3zYY6RffN6V27PS5Lwh8q8Vxiaj+UOFOxBq+YKS0YK4DDYKOAu5HqFDRzSYQEIEBcfxirRCbwVjlQYNe1mrQFE4AHlC1NarsEkEM0lUxaU1CujI+7+nMBNq05R4LWHf3MhPo9heQm2k+kAswRpExAAdS+h0sRkSLMPG0qtIF+GosnV/bAqn7CcvaL6GQRWsKQF9r4whD7EtyIkgPWrUjZx9sk0tnXfExxJ02A3xoHI2bQ7Qm03sGkYeJH0mTKDBcY84QrQRSoEqUu5YXTGruBWLc+4kTO1mPwwFsLqqaEO1S3uYx2VOfygQ9p8XmrqiOAkbGC9NTeIyCXAAAIABJREFUZbXPlRcAimdO/kjV/Ig2HDOAJISBCgNAmy+BVHvjycD99f9YoHjOTVFXNAS6kLjeK4cHs6Rg0hbU3MV+7Vj7QehLqH2xfS1ZOuv6Muvot0GfJ67X/n4bHjQuf0F74hpboPNp6VMHoPJUzKbZmjWhKZFAte9ngjzEwd2n3VbllgG77JMtP3rLH7xyNcgP5KBD5uoRyUgMmzYHSych2Af0YNy9dqkjt73z8BWNwQWDdnlPqTAN4WCdygPWscdFPtYVBVNKXALXisg80AO8o23sFzmg2a4pBmBZ5uV/EuU7QNyXsr7BnSjxNG+B7G3FDek/WqnSFY1E/NLmi1f8wJTPAzWB/0S4XWBTu3qtug7VXy8p+PqhRCBc2EoJI2w3js5t43gA3n7sssrqnd4dquY64oSEtSCi8CzK15bPmvRkW2ur5MxucxTzHdD9RY5sEeEHtJwKqoZ91altjt5euGStivwciGPSaY7AAuNwfvGDkxY13V5UNMVbXjDpcTw5F/TlOOF78a5VhepfDfJyk862Mr8IrQS91bNUaxvPUy+Ok4gQsW7TQa31+wdU+RIq4mrzJf5g0yqTw4qZl21Lyuh2rYj8J/A2rQfSiCoLVeU7xMscofHMam3TbJ6cc0thDxFztQpn1JdyA9igRhdqkj5XUZNSl661E6lfk4laq9b8a9lDkzZAfSGXhPBlqvsiLoyn7y55aPIHHPjzL+NDCxOqSsrOAT3DwElab58TtByRzR76MWreTq3eu3bRE/8Vbsc1m5F9y7wJxuiLNA8BA2HWsoJJ+e1dwo2/4fFgbXLXs6zYCwRGqDZMBWUzRpf6PP+ChKwVG9tjQwVkTH5hpk+dy0HPRmNKIjFssrDIdZz5K++bWDFuxvxxVveZRqz11hbPznv7AH2W7KkvJEqg7mxRTo/lPiKWLcLIZsWuFc+3IDkrbfWB8h6NDy30VZWXnCiuOUeFbBEGYvEj4oJuU3S9Y1hpHH2z7xYqmg5E2VPn9TIJcgkaC5MS8DzH+2fxA1Ma66qMm/FMtrW20XFBRCuTPPvCotlTYoIZCpmcslEXo9JowhF004Cd9tWGtrKnFnZ1/GaiiiRAzIPZ1ejb77VIW9PAad8q7BYNOheL7DNjqOe9vvyhKa1cJPf9luV+kjZlOq4MV0tAHFNdF7Xr/Lak3Pi7fQ0jC5qF7UFY1E5YOmtKvBSZcfm3qbqVPW3eV43wLGiLpL6y07Ey4d3ZV3QWXO0kLuNDC4PsKvEtmpVXjcQfBGOxtPI0tCjCpGz0efbMxQ9P2RrvvHgc90I5MlQYSCwx5yHMjlOm3IL+77KZeT8+Kp37N2Zw/oKE7r6q5Fr127S0tKqGL/X40MJg5baqFC+p1F2ZtmlvQ+RKg/02uO0EhY+7Bt3k8NuPXVYZi24q7xrxi9dWMrXxoYU+d2d1am3SXqcu1be3wTkle+pyf2rkA2fR4zeEEVFCITN+44BAZSDiNWjKs6e+kGQC4fnAKaLymDj6BFq3MzGjT82i0AR3cP6ChHSvIgvHf2e9CamFsk/nL8tck3cw6VGPW6HMyyt0NnR3vmYMN6P2UhpT/u1DhFVR7HlNg687ObyMDy301ZSWXRILgGCwgKvI+zZSep3j73ahitwqMEShEtVX/InOb9+554pdY6cVPSuQgJG9WHIR2aXKTMSeLpjzwYZVZfbymZNmN/2a5ebPP0VVf4TqGBGCCCs99f20LjOyLqlE/hcjo63lruJZk5fk5hedpSo/U2HV8oLJdwCMy593qlX7KkiD0qwW4SMsW0SoUjQTZBTxI2tqjOjlSwryDqpM4XFbS2Rrhi9DjPd3kO7xXQO1HHVuXzFzcocLpCoBNqQnkpDkqwvXJGPUGGOSERXxfD4JSBJufQJL8TJh/+FngKrRXXhOWMWLqGqN9WxV0DPlMmT3YY9a6DhUakrnT1F4lJjNd4vGXvavOv5uF6qRp1ASFTYI0keFOyK13oDTbi+8zo3KBKALShTR3UCOiDwWW1NrKcggEX4/Nn/+yuUxZUysRXQMMYeTzSqiqF5miPbqUsHXXTHjUD1NxD4Y6530QjnX6D5nAYt+vYlAAiSijEEY0zzNZJwfi8ytyrCLDvYuHbdCWROUiM+VUqB7nN21iPne0oIr2rJZNqLbeidV1Xgp/gTbxXjaRcQkitEuWJspQqqFXmolCaGHEVIV0t3NJKhfE8WGfY7fSRYwKCkogqM+PE1ueJYt03W0iRUQi6hEjEi1+EyV62d3dFPmVhVe8D9WOkdCB2tWOrJkTy3qopgfA0FUH7Q+vc9EHJ8jkuAZ80dUU0AecsUL+TCnovxZRC63rjmlXqdngXtFvKet9f1NRIcj8leLuduoOwfkHBG9gCZCWefWPRf0BbeoWr/E/FgfEMwQL6qtAgbiIcrYQzBQqsLLrnh3ttePuynHrVCuvG9iRU7+/IWgLe1lOwSdsfTBSXNbOg6qYrytGddg5TSNucr1iLqR1MQACWpJEkMQsQFVkhDZl2633krb9OE1WF1k34aOQQgoBATSUfohnCJwRvTGjGJCZfsJzTr6+MRkWXQ4SKkVeaT4gbzPIba+TNeaU4A6I/xlRcGUkvGh0MvVpaPWAGdYq7n184qo8aLPLXnom6typs/7FBiO1aXFsy7/NGf63A+Ac1Sbu8QFnIQeavXHImQ3SUZtjIivXY44YmeLmkEaS6Ny4KeoVKgwUyP2dyviOK23h+O3wI+IKjRN5lQLPClqzl46M68onhbN25J5pVp5WOFm4FIgt95b5wSEngppqhxoqnnkERzky/8sxTG+2BCm6jP7bH3dfVVG673GrGcNQPc1I5QGT7LGX6ZY8XuxKWvbWQMaGBkqDAg8IMIExKwT5IdAK1umiZ/oGYClBVMWOH57pqDfBP4ErGkR9maB7SCvI9wtmNzlmat/Fi+KpL0ct19KgEgw5bWEusrbVERU9R+pmRnr27LH6YasHq7aEC1tmF8ObCxomG3E8q7uIjZF2iFIusJ2f9/SL+1XMnda0SXA9dboEyifo9JPPb5z2u2Fd1c7XY2NVPY2wjpVThbHXJc99ZFlnwedM8UyFNTDmmV6YBlsZFx+4Qir5i7K5EPqs95bq/k+h90aS6xch2uj6pjKWPUqc+Zptxf+w3OZqK2/hlrv6VVEKDQve1t2kPRaf+LepH1DRarn7qz1R9YXXPRFkkE3clwL5ap7LqwGHmjPsa7j3QAy5IAHdixKzDvEAyoVPgU+FWW9iGxUqxtdnI3BaOo2Bq932TdDVgCRWAmihn8f4b63GxX5FXAKqh5oAcL/KnKnG5VbEqKVPoXNCD8D/qKqU00gc6K12gUIisi8DAm+V6r7LZnSDE9NvsDVAhu13kPHGHlRrQaBAIhVx+kK9h8o56tyuxs1M0Cc/fqjhEK2+AC1WzqC41oo24vq4AR3857LD3zkoTcBhFFqRdityjqEdWpljRg+8TneZ/TevVWkLUVN2154X2ZhbEBVXhKxPRF5zYYHPeH4P9ujwnSQHhK7L4u9SNlcJyEDa/mRiPYC3aHIU1HH3PPy/ReFc6bPfRtIUfXqtc26VqAHRj4FUGGVUZaoMZ/ieWWITFTV/8PKHzB6H9YOVZFPgc1AF091D9GyRySQ0Ru4KnYn7UJETlRYdbTuFRzHdsqDQT8bGHSdqjcgloj3CyG4KJWKVgiyCShW5SNxWO8Tu37/wnf8Mi5/QZclBRc1M99kT33EXzxnqtvcVVDlK7c923XI1mjlF4nHPOPG51Lf7r+iusFonzttfkZbdUPH37AwGE4vkcNdY7O97FcoT77zlWS/W9Wl+L4rdrTlXnS8EN2UGaqfQh3MQBUVKFVhB5b1GC0WK2sd42wk6G2U7qVfgpT9nRxr7PcFzJ02P0NFZwlqVfQlI7K0/3a74ZiOKG+D2o09BvmM9yZxstABILii7FTYIugaK2aliK72qWymb9fNIus7ZJHfSScH/CqMnT7vDBGeRTWzPsToI8UsVMsbjsiqpbOuiBcuc0wS/TzzTmLpPHwIu7DyqaJrHNGV1uoKV+22oC9lp/Tb8qWY5hyr5OUVOpuyfGle0P+Fl0+pqSl7DhThcqzRjpuikpP/TD5qf0/zDAS1QKkq74mwUNQudQKs/LLMyw8F/WRwghfce4ladkQdd1Oiz18uPXe2lR3g3xNVyZ3+TDfPRNKMl5BqHDfLUxMUoRuqXRVNE5VuAikqkgSNGeYz2FdjQ4BgR6g0FA1L8wD5GuorO6PqIrJTFE+FSkXLRU0Ew3ZUXYwpJerWIv4K64/u9sS/d38Vwo8U7bor2VMf8Yu/21PSZi0JUdBaYDfoeyryFirvpFjv/cZ4uE6+9IwPLQxW79zdW3y2j1XJQulpYABGeip0F+iuaG8QP6o+BZ/EoiIM8XMTfZlRYlkkPAVP0CiICxIF3SawC2UHIptVdCue3YyYzcbUbd6XPf/w0O6hKvuOFzKdcHi5tg5/aosoUCMiH6C6DHSx8bnLgivXbVk0HnswoSydfCGEUEjy1oyQqp4pvlJfbR9cTkA5QZQBGO2nykCUgQiZxATMATWHmkXvOESJfY09wBPYpfCRwForrBbPvpdcU/3RooGbIh3xXh/U/GHs9HlniNpX44VBHQQlAssUfV/ULEP8K/01WrozeVNkfcGMTmXJoRAKma+X5fprvSp/hUOiX80AVU5AOEFhsAgDUU4g5s97rH3RjhVqgKWi8o6qfcmXoCsOdSl3cJP6UMjklI76AfA/dKzf7BZgvcBqq3xkxH6oNvCJLyFSnVBeXVNfZPPfmvGhhb7asq1JmNREa9xkicpA0EGKDiZW+HQA0I9YXF+n4B1dqlG+v2zW5IcO5eSDXmnHIrHr/gbyjUNp8CCoBTaDbEH1cxHWW9VPjch6x9o9Yn17w7akqnjOTYfd7elIkD11uT/irEtJ8gWTXdUUR7S7RfqKlYGIDlS0jyC9iAldFh2ch/dIE/A7DOqRSlZaIiLw8dYKduw+Lh7lalV+uHzW5LglLdrDIam/cqfNPwmxL2mcwq9HiN2oliBSqqqlCJ8Lsk2NbBWPTWq00lhTrRqujQaCldGt0Zo1RQcf19YByPhbCpPDCQQilhSfJQUh0bOSqmhvQfoakR6q0g/IAO0mkF4fzf6FqgF/mUlLSeDWy0dz7pi+BP2xsWX+Wxv4zd+P2XpAAHsRedSY8O+WPHD1/rITHpBD1UlLTn7R5aLyp3hJfY8+Wi1INVCrUIVSg1CHsB1LjYjuimnc2K7giZqIGt0ptv2prjUWxt5bDI6KGlEnCyGgql1NLNtfV1XSEJJVCYiQAiSDBEG/jJEoB6Rf9xTGDM7k9VXbqKhu3xiXlODDtUokGvM3MSLkTxzNVRMG83/Fm3lpySb8jkNlbYQPPtvNmMGZ5AzNwvUsi97fxqfbKjjlxEwG9+6KVcWIsPzjXQzrl07Us7z74Q6q61yG90+nNuziGMGqsmlXFdYeESc0RWS5Wrlr0C73Xx3hWHOoDulqw7tfMIGMh4Hv0cb60u8YvnPRCAJ+wyMvraU2fKRsvJKsTevONww99Vn1G6L9G0MuREGJ1XRtdxNNAplVYlerj/vRJscALbKRHLveipeMG8D15w9lT1WYN1fvoGuSn64pCfRMT2TTrip27K7B7zNMPH0QF+X2x4iQlODjsVc+4uVlsWySXZIDnDmqJ59tr+T381axp2qfbm/CKX24+9qxeJ4l4He4ZNwAbnvobc4c1ZPrzosVaFOFPdVh0pIDWIV5b37KffNX8ZtvnUow4GAkJpQvLtnEwy+uIe+sE7lwbD+MEV5bsYUn/m8duUOzGN4/naraKAG/wztrd1BVGyU9NYGyvXWUV7Zb37gXZJYx4QeWFFy9c3kH3edDjhIpnnNTdOz0ec+K2hvaqsaVOyyLK8cPJhhw+Od7W1izcT+5njs5rKQk+jlzVC9O6NmFLkl+VnxaymsrtuJ6bWvwE/wO4ajHib26MGJAOuVVYaKeJRjwcc05Q7jmnCH4fYbEgI+SvXXcNvstBvZI5dbLT2bH7mpA6J+VQlrKvjSoQb9D16QA67bsaSaQRoTJZ51A1LXMmP0WIwek8/28MZzzlT4k1E9x73p8CXlfO5Gh/dL4zd9XctWEweQO60Fyop9gwCEl6OexVz5i/Cm9mXTmCby2Ygv9uqdQureOQT27cNPFI1ny0S5GDEjnlktHNbY96cwTuP+ZVdx11VdZ/OFOfvP3FYSuHUvvjGR++sRSNpfEM7XrUiy3DyyxS4qKru5Qt9NDEspx+Qu6WGruECVfRVqVgwNIDvq58cJhBAOxG9ovM4U1G3eTHPRTXXdoFRI6OXSG9O5K6NqxWKt4Vrns9EF0SQrwyvLNDO2XxqadlaQm+fmvC4bx8dYKvnHaQMoq6pgx+y2+c9EIcoZmUfDsByT4HfpnpbB9dw0ZXYIUf1LC2k3lXHveSYw/pQ+9M5JQVX7+5HKCAR+/v+l0uqXus6DVRlz2VEXok5lCZtcgpRUxxboIZKUlUlPn8snWCkQg4npkdgmSmhwT6rWfl1NRHaE27LH8411cOLYfGakJjROhDzeX88d/fEh5VZgffXMMQ/umUVZZx9kn9yYtJYAxQr/uKaSnJOB6lnvnvs+AHqlcOX4wNWGXytoopw/vwZDeXRl/cm/eXL2DbWUtHLpU61TMbyLB1HtW3XNh9eGILD8oocye+ojfCWRcbLXmf4GT4pXkaODrOf0YPSiD9zeUMaxfGv26JyMi/OZb4+idkczU+19n7EndSQn6+cfyz6mLegQcB9daoq5lQI9Urj33JF5ftY03Vx8467vPEfpkpLC7so7K2uNP6DO7BJl4xiC+cmImPsfw2ootzH1zA9piGSwCjjE4JvaqhuvXciUVtajCgqWfs2DpJu777hn0z0ph7End+fWNp3LvvJWs/mw3F2T3Y2d5Las+LeOSUwcw/pTejByQTmlFLcs/KSHqWfpkJLN6425cz7Js3S5eeHcj1553EoN6plIbdhERAj6H2rCLZ5XuXffVUd1bE+HttTu4esIQfnXDOBYs2URKop+uKQE+2VbB2aN7c9NFIxjQM5WAz2H1pnJOH9EDoHEdG456VNbE/u2pkpjgw4iQEvSTkujnxF5d8KySlpLA9ecPZcP2vazfVsG4YT0orwqTEHCornNZuaGMlMR665Eqb63ezlUThvDfV30V1ypFb6zHa74u9VT4+vKZzcs7dDTtE0pVGTejaLin5n8UJh7o8Ky0RP7z3JMA6NUtCZ9j6JOZgmOEE3t1oSbsUVkbZeLpg+iTkcx760uZevEIzh7di892VPLkax9zUe4Axg3LYktpNe9viPm8R+unWnVht9VwMCArlUdvH88bH2znj//4kImnD2LeWxtaj3RAav10Z091hKjbevomgM9nGr8qRwIR6JGexIj+6by9ZkejMEHsHj5wy5n0zUxmW1kNEdcjPSUBnyOM6N+NYf3S2VJaxZKPdnHq8B5cf/5QeqYnUro3zLd/vxDPKnVRj/LKMGeN7sXpI3qSmOBjZ3ktW8uqEYHe3ZJZvHYnlbVRenZL4pGX1nD6yJ7kXzaa7l0TmffWBsIRj4rqCD3Sk9hbHSEc9chKS6S8KnYfs9IS+dM/13HxuAGErh2L6ylJCT7SUxMQia0HVeGPL39IWnKAs0/pzeiBY/CssmH7Xu7+yzL6Z6Uy+WsnYC08v3gjC9/fSvaQTKrrXGrDLq5ncT2Lz2cwAtbG2jBGOKFXF57/+ddJDvpZsb6EdVv2YEQQgUE9Y7WgPKt0Sw3iWksk6jUKZXWdy+urtnH1OUM4qU9Xln60ixXrS1s+JgflN+PyF1zQMja0IzmgUJ783flZCflzb7KYOyR+XcdmGCN88+zB9ExPYtH720gK+khPSaBHeiJpKQEyuybyr5VbSQ76yOgSpGRvHUP6xKYL67bswVc/xTj5hFjx4ZsvHYnfZzh7dC9cT/FUeej51Qzp05WkoI9l60pYs2k3qUkBfI6htKKWs0b14ppzh7BxZ2Vcofzpf45l7JDuXH/Pv9i8q/V6ISstkbuuzuaf723hhXc3tuc+HjIJfgdrFb/P8KsbcklPSWDnnlrWb60gHPUQEa45Zwh9M5OZs2Atf/3XJ3ieNipU7ph8CrVhlwS/w73z3qe0oo6TB2VQXhXm/U9LGwevuojH7qowfTOT+XjnHoIJDtedP5S318RmIb0zkqmNuOytiZDZNciO8lqeW/wZN5w/DEVZ+WkpdRGX8sowqUl+op4lHLVkdo1Vkd9RXkNqop9l63Yx6/nV/EdOf6xVstISW+m2quqi/OqpYv7y2sdkdU2kJuzy8dY91EU8vvP7RfTJTKYu6rGttBqryqMvf8jTiz7FWuWxVz4iJdFPZU2Umc+tJpgQW/cK8MFnu/loSzm794Z5fvFnVNZGeXrRes4Y1ZO9NRFqIy5R11IXdimtqKOqNkqXpABWlcraCBt2xLYF/Q5//dfHcQdkERnnafVTo29+8doPHrqk/HC8E20K5Wm3FyZa17nYqv0JyMm003zSu1sSl546gI+3VvCrp4qprI3wtx+fT5+MZPp3j2X/27Wnlu5dE+neNci6LXvYsH0v5VVhBmSlMPfNDfz1Xx8ztF8aowZ24+EX11BaUceVZw8m4DdsKa3mtBE9mXjGIFSVa88byl2PL8GI4HOE0r11GCNEXcu2smq+cmImpw3vgWeVhe9vZVtZNV8dnMmKT0vZWx1hWL90quqibCurblSh98lM4dThPfhoc/OAAb9jSEtJIOp67KmOYIyQ2SW2XgoGHHbsriHgc+jTPRnPU4IBh5I9tZRU1DGsfxpjh2RRVRdl4cqtVNZGuf78oeQOzaIm7LJ+WwUn9UnD7zM89r0JfOf+RazaUEbAZxgxoBsle+p4ccmmxi97OOqxdlM5r6/aRlpKAmNOzOT8MX2Z9cJq6qIu76zZwQPPrGqUh3DUo7yyjpSgj588sZSbLxnJxeMG0C01tq4bPagbU84eTEZqENe1pAR9PL1wPZedNojkoI9VG8qoi3qs31ZBapKf6jqXF9/dyJbSajxV7v7zssaZzIj+6eytjpCWkoAxwuIPd7Sqq9rwddywvfkHpzYSuxdN2bG7hh31qXE+2bpv36rPYjOok/qm4TjCZzv28rvC5mVAC577gILnPgBiyiRjhPufWUVigo+Kmgh/W/gJb3ywjairXJDdj8SAj+JPSli6bhdtIchFQV+4YOQthd9dcxgCLloLpaqMnTHvK9GI/lhEL+Ugi8KWV0X44R/fpaYuNuoCfLKlgglf6UNFdZhI1OP87L6cOqwHyUE/G7bvpVtqArOfX831Fwzlm2fH7FfpKQnsqQrz6ntbGNovjYSA4fnFm3joxdUM7ZvGwB6p9M5I4sTeXckZmsWn2yrwOYbdlWGG90/HWiXiWq4/7/+3d+7BcZVlHH6+c87uZpNsLptstmmTJunV3mxDsFiK0FpQ0ZHLaFHREXXGjjiiwOgwo47WyzjecMYbiAwqoEVb6lDFWq3cSilDU6ulN0qakqRpkt3NJtlN9n7O9/rH2aZFeoWALfaZ2T92d3b27Oz3ne+9/t5ZzG0KUuqzuO7SFu7btJ9EKs+m9h5+fPNlzGqoJJku8JVfP8c/O04ull4fLOWLKxcxrb6CfEFz36b9bD8Q5a7PX45luKH/1Q/u4MZ3zqR1ei22o/H7LO5+dC/PH4rznU9dgqEUZSUWl84Ns/7pQ6x671w6+xNoETr7k8QSGRpD5fx0w24iw8eqW0Rc89b4r5SNZRksnh0mV3BIZQtUlHkp2OKenF4DZSikeKMp2JrBRJbW6bV89cY25jcHiSezHOxLcP/mF/jsNQv46PKZHImniI5kMA2DqnIvHtNgf88IA8Xr+cG6f5O3XdPvZ3/aM34te4qRda9lcCSeoiFUTjpX4K4/7+GRbS+dzRI6a3pjY6x+YAfRxKlLTbUI2hGGRnNQTHt0RUbpiozynoun8pWPXER0JMOP/rjrdG6LQuTDpaaZWfqpDbc/86trJ1Rh4mWbsm3Vmlrjc+tvQXEzSp1IWfy0pLKFV9jid67fxZonOuiLp/nhw7u4qq2BEo9FIpUnnsjyuWvnEwyU4POYFGzXZwgGfORtTUNtOXVVfryWyb6eIfIFzR03tDIpWEp/sSwrlSmMR/iGx3IEAz5s7Zokzx2I4vWYTJ9cQajST97WfOYnW5jfFGRuUzU7XoxxqD95QjP3eETA77XoiY7RNjPELdcu4GPf+wflJRZ+n8WW5/u56qIG3jarjj88dRCfx+T6pS34vRbXLW0h4Pfw7P4IcxqruWx+PY/96whahIDfw96uIdoPRJkxuZKPXzmLrXv6iQy7Cyxva144PMzcpmm8u62Rh548iIgwq6GKdy6cTInXZN3TnVzZOqXoHwnpnEOo0o/HNMjpY75pV2SUsUyBUJWfbfsG+MNTnSRTeR5++hDtL8YwDcVgIku24FDqs/jWTYvxeU3u33xsHOfYaYJoeVvzy7/s4/7NB3C0nNBnn2jSOZsndp3xUKsT8kLvML/cuI/NO3s5MnhGLbQmwifyZXb86ls2fv2vEyQvCcdtypUr15pdXuuroD8JvIoJySdnZCw3npN6ZNtLbNzejWkaBPwexrIFeuMpVixyF9Wm9h764mm6I6NcMifMze+fNx7o6Y+nCQZ8NIUD7O0eorMvSXM4QGQkw1sa3czM8GiOmooSbEcTqvDz6avnIBxbTANDaWIjGQ6YI8QSGRZOq8Eu+kenwnY0jtbMmVqNZSoqi2F6EeiOjLH6wXa+/YnFKAW/e7yD6nIv1y9twWMZ1ARKMJRiflOQTN4N+e/tGuJH63fx3sVNXLOkhWgiO25ZzGqoIp1ziAynERHWbz3EitYGVr1vLle1NWIaisk1pfz2sQ4APrp8JqahSGULCPDvzkEKZIvoAAAGK0lEQVTSWfsVJuPaLZ1s3N5NtqBJZQvj5vpRU/J4cnmHLbv7ONiXZNu+s6saE1wf9nyia2CU3wycdCzlSRALkdsHJVWYt3LttyaqlHN8U65bd4Mz45aNdwQk8X1Tea4wNFeKYhnQwgSr3uVtDbYer/DZ2RFjZ0dsPEIH8LUH2lnQUkMilSMYKOEv27vpjo4yMpan/cUoF890qzIAMjmb6mKCOjKSpqLUS8HW+H0mVeU+Nu/sJRjw0RgqZ6yYIzUNxU8f2c3SefW8q62RhdNqXnG3TeeOnQorWhtYPDvM+q2HeGtLkKZwgMpS9zuPRmmP5tyWzAljmW6Rk6M13dFRWmfUsnnnYXpiYzSGyskWHK5Z0szh6BjzmqopK7HY0xXHdjRf/shF3P/3A/zqb+4J9dJAktvveYYPXTGDxlA56Zxmw7YuNjz7Eu0HooSqSnixN8FYpkAynee7v9+Jc4LIcSZnn3FVlRbhF4/u4ywqD/9PUR4UXyoLE125cu1dE15mV1R47gMeQuT3825Y5ymrs5o1+iqlWI7IFSijCrcJdsLlKY///xOpPFuPy09u2d03/v6tdz1DY1158cQo4+AR15+MJ3Pk8m7ULpnOs7d7mEP9SZYvdLWwtBbXPwM++I5prLx8BiBk8jaDyVd2h3366rlcd2kLtqN5/lAcpaBtZi2NoXK0gMcyXrbINzzbxYqLGrjjQ63jr9VW+Llv035ap9fygXdMR0QYSeX5247D+Dwml86bxJbn+1jzeAfxZJZv/vafTK0rf9npJAL7uodZ/eAOiulH97fA+I3geCYqjfMqN6Sc6CHugulT4AhqCI4bnY7Rq0ROaaooJSHh2MRl94OqRCnqjj2lHhlvWzu6Po2TPJ9IfAJ3doeNAiL3vFblx7Pup7w4Pn+hIVwioi5DyWIg7I5yk3NS2NnvtYonk01lmY+DfQkyOZtwtZ/3XDyVilIvz+wd4F+dsfFNP63eLck6njVPdLBi0RTmTK2mfyiFZRr84tG9XL5gMlqENY93YCjFTe+aTUmx6mVFawP3/nU/927ch89jMq2+Ai1CT2SUzHlm3hUpFOUyCoANxIABBf0aBhRGnxIdQ5EQQ6JaqyFLqbHnanb3vZFKE27v6dAkAGwnLAZejaozFF5Rql7Ap4QpgqpWItUoCSOqDkUAtyXOi3tgWZzdJs4ojJu2/+z6h08z9v6UvKbTbtnqJ6xcItlcKBQWKni7iLxdKdWsoMqdOzjxp+m5zJTaMu69bdl4mqQvnuYLd2+lO3LeyL8WcDvoM8VHL9ANchiMLhEdEdQAlu4PVIeiT65e/qZqPl9y21p/tuBUe/BMVkqCWlQdSoURacRVbWjC7WX1K/CLO3fmvzdtRoQPvuH9lKdiwc2/qy61SmZr0XNALQRZBEf7BU9ffHA+47EM3jarjuZJAbJ5h+deiJxpJO+NJA0kgaTAsBK6FeqgGNIlmiMY9DviiVTWVkTfbNKNE0Hbqj+Xmt5MWCkz7IhMURgtoGcCb0ERRggCDiIfa//5ysdezXe8/ieZiLrk1ofqbNs3RSlpMZAFgloAqgkkJBBWZ5kLvcApESABDAPDCgYE6VJKdQnSicOAUs5gRjux3XffOPJazKwLvJxFt/66yueUTXY0U5SounRM1r2aiOz/zLx86xcfKPMUSmqwzVpDMRP0LJQxG5HG4h2nnglOzbyJSCIMYagYIkMCvUqpLkS6EKfHMHyDRiGfSBokXo+Kkwu8vpxzPt+S29b6VcYKZA27wjAJGhjTRUszShV1agiBKmqQnouqB68RxSjCCG4QZQgYAAZE5AhKHUaZh7VTGBLDSXtV5Zi/xp++YGa+uTjnNuWpaFt1jydrVfsqfHjzYvosx6kWsSaJcurBmIToSSijSiEh0YRQUqpQoaIKQdX/4JIFV607B8RBpREZVDAiSo0qpXsElTRQMdHqiHglolNkTI/Ke8rM/EQOIr3A+cN5tSnPDFHLln3DjC2ba0yNl6tozjGzVsYoN/NGXsxy0/AFRdvKEqMRQBuYSksYpc46pSMKx9CMVxw4hh5EWWlt5x1lG32WLy8Zn3Y8yWoJ5Ad1rLlMhwjpJ3nqghj1BU7KfwDfySCyBI8C6AAAAABJRU5ErkJggg==';

// returns nothing, modifies a doc object
function addDocSettings(doc) {
  doc.settings = {};
  doc.settings.pageWidth = 210; // mm
  doc.settings.marginX = 10; // mm
  doc.settings.marginY = 16; // mm
  doc.settings.contentBottomY =
    doc.internal.pageSize.height - doc.settings.marginY;
  doc.settings.contentWidth = doc.settings.pageWidth - doc.settings.marginX * 2;
  doc.settings._y = doc.settings.marginY;
}

function generateSalesContract() {
  var doc = new jsPDF('p', 'mm', 'a4');
  addDocSettings(doc);

  // some number variables
  var fontSm = 10;
  var fontMd = 14;
  var fontLg = 16;
  var spaceSm = 8;
  var spaceMd = 12;
  var spaceLg = 16;

  var xStartLeft = doc.settings.marginX;
  var xStartMid = doc.settings.contentWidth / 2 + doc.settings.marginX;

  // logo
  var logoWidth = doc.settings.contentWidth / 5;
  var logoHeight = logoWidth / 229 * 115;
  doc.addImage(
    logoDataString,
    xStartMid - logoWidth / 2,
    doc.settings._y,
    logoWidth,
    logoHeight
  );

  doc.settings._y += logoHeight + spaceLg;

  // title
  doc.setFontSize(20);
  doc.addText('Contract of Sale', xStartLeft);
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
  doc.settings._y += spaceMd;

  // label row 2
  doc.setFontSize(fontSm);
  doc.addText('Model', xStartLeft);
  doc.addText('Kilometres', xStartMid);
  doc.settings._y += spaceSm;

  // content row 2
  doc.setFontSize(fontMd);
  doc.addText($('input#model-1').val(), xStartLeft);
  doc.addText($('input#kilometres-1').val(), xStartMid);
  doc.settings._y += spaceMd;

  // content row 3
  doc.addText('I, ' + $('input#contractCustomerName').val(), xStartLeft);
  doc.settings._y += spaceMd;

  // content row 4
  doc.addText('of, ' + $('input#contractCustomerAddress').val(), xStartLeft);
  doc.settings._y += spaceMd;

  // content row 5
  doc.addText(
    'hereby agree to sell my car to Car Buyers Australia Pty Ltd for the amount of:',
    xStartLeft
  );
  doc.settings._y += spaceMd;

  // content row 6
  doc.addText('$ ' + $('input#contractAgreedPrice').val(), xStartLeft);
  doc.settings._y += spaceLg;

  // contract content
  $('.contract__content > p').each(function() {
    doc.addText($(this).text(), xStartLeft);
    // add gap for each paragraph
    doc.settings._y += spaceSm;
  });

  // bottom label row 1
  doc.setFontSize(fontSm);
  doc.addText('Customer Signature', xStartLeft);
  doc.addText('AreYouSelling Rep (Witness) Signature', xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 1

  var signatureAspectRatio = 1 / 8;
  var signatureWidth = doc.settings.contentWidth / 3;
  var signatureHeight = signatureWidth * signatureAspectRatio;

  var customerSig = $('input#customer-signature-string').val();
  if (customerSig) {
    doc.addImage(
      customerSig,
      'PNG',
      xStartLeft,
      doc.settings._y,
      image,
      signatureHeight
    );
  }

  var repSig = $('input#rep-signature-string').val();
  if (repSig) {
    doc.addImage(repSig, xStartMid, doc.settings._y, image, signatureHeight);
  }

  doc.settings._y += signatureHeight + spaceMd;

  // bottom label row 2
  doc.setFontSize(fontSm);
  doc.addText('Model', xStartLeft);
  doc.addText('Kilometres', xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 2
  doc.setFontSize(fontLg);
  doc.addText($('input#model-1').val(), xStartLeft);
  doc.addText($('input#kilometres-1').val(), xStartMid);
  doc.settings._y += spaceMd;

  // bottom label row 3
  doc.setFontSize(fontSm);
  doc.addText('Customer Name', xStartLeft);
  doc.addText('AreYouSelling Rep (Witness) Name', xStartMid);
  doc.settings._y += spaceSm;

  // bottom content row 3
  doc.setFontSize(fontLg);
  doc.addText($('input#customerName-3').val(), xStartLeft);
  doc.addText($('input#repName-1').val(), xStartMid);
  doc.settings._y += spaceMd;

  // bottom label row 4
  doc.setFontSize(fontSm);
  doc.addText('Date', xStartLeft);
  doc.settings._y += spaceSm;

  // bottom content row 4
  doc.setFontSize(fontLg);
  doc.addText($('input#contractDate-1').val(), xStartLeft);

  doc.save('ays-contract.pdf');
}

function generateInternalRecord() {
  var doc = new jsPDF('p', 'mm', 'a4');
  addDocSettings(doc);

  // some number variables
  var spaceSm = 8;
  var spaceMd = 12;
  var spaceLg = 16;

  var xStartLeft = doc.settings.marginX;
  var xStartMid = doc.settings.contentWidth / 2 + doc.settings.marginX;

  // logo
  var logoWidth = doc.settings.contentWidth / 5;
  var logoHeight = logoWidth / 229 * 115;
  doc.addImage(
    logoDataString,
    xStartMid - logoWidth / 2,
    doc.settings._y,
    logoWidth,
    logoHeight
  );

  doc.settings._y += logoHeight + spaceLg;

  // title
  doc.setFontSize(20);
  doc.addText('Internal Record', xStartLeft);
  doc.settings._y += spaceLg;

  // signature sizing
  var signatureAspectRatio = 1 / 8;
  var signatureWidth = doc.settings.contentWidth / 3;
  var signatureHeight = signatureWidth * signatureAspectRatio;

  $('.tab').each(function() {
    $tab = $(this);
    var tabTitle = $tab.find('.tabTitle').html();
    doc.setFontSize(16);
    doc.addText(tabTitle, xStartLeft);
    doc.settings._y += spaceMd;

    doc.setFontSize(12);
    $tab.find('.field').each(function() {
      var $field = $(this);
      var fieldName = $field.find('.fieldName').html();
      var fieldValue = $field.find('.fieldValue').html();
      if (
        fieldName == 'Rep Signature String' ||
        fieldName == 'Customer Signature String'
      ) {
        doc.addText(fieldName, xStartLeft);
        doc.settings._y += spaceMd;
        doc.addImage(
          fieldValue,
          'PNG',
          xStartLeft,
          doc.settings._y,
          signatureWidth,
          signatureHeight
        );
        doc.settings._y += 20;
      } else {
        doc.addText(fieldName + ': ' + fieldValue, xStartLeft);
        // add space after every line
        doc.settings._y += spaceSm;
      }
    });

    doc.settings._y += spaceMd;
  });

  // photos

  // photo sizing
  var photoAspectRatio = 3 / 5;
  var photoWidth = doc.settings.contentWidth / 2;
  doc.setFontSize(16);

  $('#vehiclePhotos img').each(function(index) {
    var photoHeight = photoWidth * photoAspectRatio;
    doc.checkOrUpdatePaging(
      photoHeight + px2mm(doc.internal.getLineHeight()) + spaceMd
    );
    if (index == 0) {
      doc.addText('Vehicle Photos', xStartLeft);
      doc.settings._y += spaceMd;
    }
    doc.addImage(
      $(this).attr('src'),
      'PNG',
      xStartLeft,
      doc.settings._y,
      photoWidth,
      photoHeight
    );
    doc.settings._y += photoHeight + spaceMd;
  });

  doc.settings._y += spaceLg;

  $('#licenseAndRegistrationPhotos img').each(function(index) {
    var photoHeight = photoWidth * photoAspectRatio;
    doc.checkOrUpdatePaging(
      photoHeight + px2mm(doc.internal.getLineHeight()) + spaceMd
    );
    if (index == 0) {
      doc.addText('License and Registration Photos', xStartLeft);
      doc.settings._y += spaceMd;
    }

    doc.addImage(
      $(this).attr('src'),
      'PNG',
      xStartLeft,
      doc.settings._y,
      photoWidth,
      photoHeight
    );
    doc.settings._y += photoHeight + spaceMd;
  });

  doc.save('ays-internal-record.pdf');
}

$(document).ready(function() {
  var $wrapper = $('.contract-page');
  if (!$wrapper) return;
  $('#save-contract').click(function(e) {
    generateSalesContract();
  });
});

$(document).ready(function() {
  var $wrapper = $('.internalRecord-page');
  if (!$wrapper) return;
  var imageCount = $('.inspection-image').length;
  var updatedImageCount = 0;
  $('.inspection-image').each(function() {
    var $img = $(this);
    toDataURL($img.attr('src'), function(dataURL) {
      $img.attr('src', dataURL);
      updatedImageCount++;
    });
  });

  function checkAllImagesUpdated() {
    if (imageCount == updatedImageCount) {
      // only generateInternalRecord after all image url updated to data uri format
      generateInternalRecord();
      return;
    } else {
      setTimeout(checkAllImagesUpdated, 300);
    }
  }

  $('#save-record').click(function(e) {
    checkAllImagesUpdated();
  });
});
