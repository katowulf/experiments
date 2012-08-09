jQuery(function($) {
   var $paper = $('#paper');
   var paper = new Raphael($paper[0], 500, 500);

   function Color(h, s, l) {
      this.base = {
         hue: h || rand.apply(null, colorRange.hue),
         sat: s || rand.apply(null, colorRange.sat),
         lum: l || rand.apply(null, colorRange.lum)
      };

      this.grad = {
         hue: this.base.hue,
         sat: this.base.sat,
         lum: rand(this.base.lum - .3, this.base.lum - .5)//Math.max(0, rand(this.base.lum - .5, this.base.lum - .8, 2))
      }
   }

   Color.prototype.clone = function() {
      var b = this.base, col = new Color(b.hue, b.sat, b.lum);
      col.grad = $.extend({}, this.grad);
      return col;
   };

   Color.prototype.shiftHue = function(newHue) {
      //todo assumes hue gradient is same as base
      //todo if we modify the hue for gradients, this will need to get changed
      this.base.hue = this.grad.hue = newHue;
      return this;
   };

   Color.prototype.toHsl = function(gradientOffset) {
      var v = gradientOffset? this.grad : this.base;
      return sprintf('hsl(%f, %f, %f)', v.hue, v.sat, v.lum);
   };

   Color.prototype.toGrad = function() {
      return '25-'+this.toHsl()+'-'+this.toHsl(true);
   };


   paper.customAttributes.hue = function(h) {
      var color = this.data('Color');
      if( !color ) {
         color = new Color(h);
         this.data('Color', new Color(h));
      }
      else {
         if( this.data('id') === 'blade1' ) { $('#log').text('shifting hue: '+h); }
         color = color.shiftHue(h);
      }
      return {fill: color.toGrad()};
   };

   var leafTemplate = "m {x},{y} c 0,0 -42.102225,52.269256 -1.607094,80.356389  " +
      "c 1.403549,0.973489 1.314833,0.46002 3.202805,-0.145135  c 46.265,-14.83 -1.596,-80.211 -1.596,-80.211  z";
   var stemTemplate = "M {x},{y} l -0.348,-17.895  l -13.088,-24.22  l 12.842,19.732  l 0.438,-12.296  l -11.346,-19.815  " +
      "l 11.141,16.075  l 0.586,-13.985  l -6.097,-10.529  l 6.03372,8.822155  l 1.03783,-27.66312  l 0.380212,27.255499  " +
      "l 6.699663,-9.72853  l -6.71,12.279  l 0.584,13.981  l 11.449,-17.82  l -11.304,21.023  l 0.255,12.889  " +
      "l 14.617,-22.434  l -14.22,26.404  l 0.57797,17.702484  z";
   var leafOffsetFromStemX = 1.233625;
   var leafOffsetFromStemY = -94.319188;
   var leafs = [];

   var colorRange = {
      hue: [.301,.38, 3],
      sat: [.65,.85, 2],
      lum: [.6,.8,2],
      run: [0,.3]
   };

   for(var i=0; i < 10; i++) {
      var scaleX = rand(.9, 1.25, 2), scaleY = rand(1, 1.5, 2), x = 75 + i * rand(1,20), y = 150 + i * rand(20,50), po = $paper.offset();
      $('<div class="marker" />').appendTo('body').offset({left: x+po.left, top: y+po.top}); //debug
      var xb = x+leafOffsetFromStemX, yb = y+leafOffsetFromStemY, rotate = rand(35, 95);
      var leaf = paper.set().data('id', 'leaf'+i), randHue = rand.apply(null, colorRange.hue);
      leaf.push(
         paper.path(leafTemplate.replace('{x}', xb).replace('{y}', yb)).attr({
            "fill-opacity": '1',
            stroke: 'none',
            hue: [randHue] // necessary to make animate happy
         }).data('id', 'blade'+i),
         paper.path(stemTemplate.replace('{x}', x).replace('{y}', y)).attr({
            fill: '0-#967F6A-#42280A',
            "fill-opacity": '1',
            stroke: 'none'
         }).data('id', 'stem'+i)
      );
      leaf.transform("S"+scaleX+","+scaleY+","+x+","+y+"R"+rotate+","+x+","+y);
      leafs.push(leaf);
   }

   function rand(min, max, dec) {
      if (arguments.length < 2) {
         max = min;
         min = 0;
      }
      if (dec) {
         return round(Math.random() * (max - min) + min, dec);
      }
      else {
         return Math.floor(Math.random() * (max - min + 1)) + min;
      }
   }

   setTimeout(function() {
      console.time('animate');
      var i = leafs.length;
      while(i--) {
         leafs[i][0].animate({hue: 0}, 8000, function() {
            console.timeEnd('animate');
            isAutumn = true;
         });
      }
   }, 2000);

   var shiftAmt = .3;
   var shiftInc = .001;
   var isAutumn = false;
//   var shiftUp = false;
   function shiftHue() {
//      if( shiftUp ) {
//         shiftAmt += shiftInc;
//         if( shiftAmt >= colorRange.run[1] ) {
//            console.log('reached max');
//            shiftUp = false;
//            shiftAmt = colorRange.run[1];
//         }
//      }
//      else {
         shiftAmt -= shiftInc;
         if( shiftAmt <= colorRange.run[0] ) {
//            console.log('reachedMin');
//            shiftUp = true;
            shiftAmt = colorRange.run[0];
            clearInterval(shiftInterval);
            isAutumn = true;
         }
//      }
      var i = leafs.length;
      while(i--) {
         var leaf = leafs[i][0], color = leaf.data('Color').shiftHue(-shiftInc);//shiftUp? shiftInc : -shiftInc);
         leaf.data('Color', color);
         leafs[i][0].attr({
            fill: color.toGrad(25),
            fillOpacity: 1
         });
      }
   }

   function round(num, digits) {
      var p = Math.pow(10, digits);
      return digits? Math.round(num * p) / p : Math.round(num);
   }

//   var shiftInterval = setInterval(shiftHue, 10);

   $paper.on('mousemove', function(e) {
      var off = $paper.offset();
      $('#log').text('x: '+ (e.pageX-off.left) +', y: '+ (e.pageY - off.top));
   });

});