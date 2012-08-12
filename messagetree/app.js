jQuery(function($) {

   /** CONFIGURATION
    ******************************************************************/

   var $PAPER = $('#paper');
   var PAPER  = new Raphael($PAPER[0], 500, 500);
   var undef;

   // Vector used to create a Leaf
   var LeafTemplate = {
      blade: 'm {x},{y} c 0,0 -42.102225,52.269256 -1.607094,80.356389  ' +
         'c 1.403549,0.973489 1.314833,0.46002 3.202805,-0.145135  c 46.265,-14.83 -1.596,-80.211 -1.596,-80.211  z',
      stem: 'M {x},{y} l -0.348,-17.895  l -13.088,-24.22  l 12.842,19.732  l 0.438,-12.296  l -11.346,-19.815  ' +
         'l 11.141,16.075  l 0.586,-13.985  l -6.097,-10.529  l 6.03372,8.822155  l 1.03783,-27.66312  l 0.380212,27.255499  ' +
         'l 6.699663,-9.72853  l -6.71,12.279  l 0.584,13.981  l 11.449,-17.82  l -11.304,21.023  l 0.255,12.889  ' +
         'l 14.617,-22.434  l -14.22,26.404  l 0.57797,17.702484  z',
      bladeOffsetX: 1.233625,
      bladeOffsetY: -94.319188
   };

   // color range for leaves
   Color.defaults = {
      hue: [.301, .38, 3],  // the range for hue of leaves
      sat: [ .45, .75, 2],  // the range for saturation of leaves
      lum: [  .6,  .8, 2],  // the range for luminosity of leaves
      run: .3               // the animation range for a change of seasons
   };

   // Default properties for a Leaf, functions are evaluated at instantiation
   Leaf.defaults = {
      x: 0, // the connection point of the stem
      y: 0,
      template: LeafTemplate,
      blade: {
         stroke: 'none',
         'fill-opacity': .9,
         hue: function() { return [rand.apply(null, Color.defaults.hue), rand.apply(null, Color.defaults.sat)] }
      },
      stem: {
         fill: '0-#967F6A-#42280A',
         "fill-opacity": 1,
         stroke: 'none'
      },
      scaleX: function() { return rand(.9, 1.25, 2) }, // if this doesn't match scaleY, the leaf will appear skewed
      scaleY: function() { return rand(1, 1.5, 2)   },
      angle:  function() { return rand(35, 95)      }  // turn the leaf (around the stem's connection point)
   };

   /** CUSTOM ATTRIBUTES: special animation/attr() behaviors for Raphael
    ******************************************************************/

   /**
    * Applies a gradient fill using hsl() and makes for easy hue shifting.
    *
    * (we couldn't call this method `gradient` because that seems to be a reserved custom (I know) word.
    * @param {number} h between 0 and 1
    * @return {Object}
    */
   PAPER.customAttributes.hue = function(h, s, l) { //todo rename to color?
      var color = this.data('Color');
      if( !color ) {
         color = new Color(h, s, l);
         this.data('Color', new Color(h, s, l));
      }
      else {
         color = color.shiftHue(h, s, l);
      }
      return {fill: color.toGrad()};
   };

   PAPER.customAttributes.wiggle = function(num) {
      if( num === 0 ) { return {}; }
      else {
         //todo
         //todo
         //todo
         //todo
         //todo return {transform: ???}
      }
   };

   /** TREE: a tree graphic and canvas element
    ******************************************************************/

   function Tree(paper) {
      this.paper = paper;
      this.leaves = [];
      this.attachPoints = []; //todo
   }

   Tree.prototype.addLeaf = function(attributes) {
      var i = this.leaves.length, x = 75 + i * rand(1,20), y = 150 + i * rand(20,50); //todo
      this.attachPoints.push([x,y]);//todo
      var po = $PAPER.offset(); //debug
      $('<div class="marker" />').appendTo('body').offset({left: x+po.left, top: y+po.top}); //debug
      var leaf = new Leaf(this.paper, $.extend({}, attributes, {x: x, y: y}));
      leaf.attach(x, y).graphic().show();
      this.leaves.push(leaf);
      return this;
   };

   /**
    * Apply a wind effect to the tree. In autumn, leaves can fall off. Otherwise, they hold firm.
    *
    * @param {Wind} wind
    * @param {Function} [callback]
    * @return {Tree}
    */
   Tree.prototype.applyWind = function(wind, callback) {
      //todo
      //todo
      //todo
      console.time('applyWind'); //debug
      var leaves = this.leaves, len = leaves.length, i = len, complete = 0;

      function checkComplete() {
         complete++;
         if( complete == len ) {
            console.timeEnd('applyWind'); //debug
         }
      }

      while(i--) {
         leaves[i].applyWind(wind, checkComplete);
      }

      return this;
   };

   /**
    * Changing seasons is really an adjustment of hue, saturation, and lumosity values. For now, these can't exceed
    * 0 or 1 or weird things will happen (leaves disappear or turn black). Later, maybe Color can be updated to
    * account for such things.
    *
    * The `props` array contains strings or numbers representing hue[, sat[, lum]], if it is a number, then it is
    * the new value for the attribute as a percent (0.0 to 1.0). If it is a string, then it should be in the format
    * '-=0.2' or '+=0.2', which means to subtract/add 0.2 to the current value.
    *
    * If `props` is a number or string (not an array) then it is used for the hue property.
    *
    * @param {Array|number|string} props  see above
    * @param {int}         [duration]  in milliseconds (defaults to 8000)
    * @param {boolean}     [relative]  adjust relative to current, instead of setting to the values provided
    * @param {function}    [callback]
    * @return {Tree}
    */
   Tree.prototype.changeSeason = function(props, duration, callback) {
      //todo instead of passing animation methods here, let's define "seasons" and config variables
      //todo or as a new Class and let them do the animate, then pass a Season instance here?
      //todo then the Season instance can decide how firmly leaves are attached
      var opts, attr, leaf, args = _makeArgsChangeSeason($.makeArray(arguments));
      console.time('changeSeason'); //debug
      var leaves = this.leaves, len = leaves.length, i = len, complete = 0;

      function checkComplete() {
         complete++;
         if( complete == len ) {
            console.timeEnd('changeSeason'); //debug
            if( args.callback ) { args.callback(); }
         }
      }

      while(i--) {
         leaf = leaves[i];
         attr = _adjustHueArray(args.attr, leaf.color.base);
         console.log('animating', leaf.id, attr);
         leaf.graphic('blade').animate({hue: attr}, args.duration, checkComplete);
      }
      return this;
   };


   /** LEAF: a leaf graphic including stem, blade, and event handlers
    ******************************************************************/

   function Leaf(paper, attributes) {
      var idNumber = Leaf.counter++;
      this.id = 'leaf'+idNumber;
      var opts = _opts(Leaf.defaults, attributes);
      var leaf = paper.set().data('id', this.id),
          x    = opts.x, y = opts.y,
          xb   = x + opts.template.bladeOffsetX,
          yb   = y + opts.template.bladeOffsetY;
      leaf.hide().push(
         paper.path(opts.template.blade.replace('{x}', xb).replace('{y}', yb))
            .attr(opts.blade).data('id', 'blade'+idNumber),
         paper.path(opts.template.stem.replace('{x}', x).replace('{y}', y))
            .attr(opts.stem)
            .data('id', 'stem'+idNumber)
      );

      this.leafGraphic = leaf;
      this.attached = false;

      // apply the options for scale, angle, etc
      // the Transformation helps us keep track of where we are and make sure than any modifications we
      // make from this point forward are cumulative (as Raphael tends to go back to square one with each
      // call to transform)
      this.transformation = new Transformation({
         x: x,
         y: y,
         scaleX: opts.scaleX,
         scaleY: opts.scaleY,
         angle: opts.angle
      });

      // the Color instance is inside during paper.customAttributes.hue; this is a bit circuitous but
      // necessary to make Rapahel's animations work with customAttributes; otherwise, we have to manually
      // run all the animations ourselves, which is a mess, so this small coupling mess prevents a bigger
      // coding mess
      this.color = leaf[0].data('Color');
   }
   Leaf.counter = 1;

   /**
    * @param {string} [part]
    * @return {object} raphael path object or set of paths (if no part provided)
    */
   Leaf.prototype.graphic = function(part) {
      switch(part) {
         case 'blade':
            return this.leafGraphic[0];
         case 'stem':
            return this.leafGraphic[1];
         default:
            return this.leafGraphic;
      }
   };

   Leaf.prototype.attach = function(x, y, angle) {
      this.attached = true;
      this.transformation.vertex(x, y);
      if( angle ) { this.transformation.rotate(angle); }
      this.transformation.checkpoint().apply(this.graphic());
      this.graphic().show();
      return this;
   };

   Leaf.prototype.detach = function(x, y) {
      this.attached = false;
      this.transformation.vertex(x,y);
      //todo
      //todo
      //todo
      return this;
   };

   Leaf.prototype.applyWind = function(wind) {
      if( true ) { //todo
         var self = this;
         return $.Deferred(function(def) {
            // leaf is attached, so it shudders
            //todo
            var count = 20;//rand(Math.floor(wind.strength*30), Math.floor(wind.strength*60));
            console.log('count', count);
            var i = count, min = -20, max = 20; //todo
            var tr = self.transformation, graphic = self.graphic();
            var pipe = $.Deferred().resolve();
            var duration = 500; //Math.floor(wind.duration/count/2);
            //todo
            //todo
            //todo this is what we want
//            console.log('shaking'+count+'times');
//            while(i--) {
//               pipe = pipe.pipe(function() {
//                  console.log('up');
//                  return tr.rotate('+='+rand(min,max)).animate(graphic, duration, 'elastic');
//               })
//               .pipe(function() {
//                     console.log('down');
//                  return tr.rotate('-='+rand(min,max)).animate(graphic, duration, 'elastic');
//               })
//            }
//            pipe.done(function() {
//               console.log('reset');
//               tr.reset().animate(graphic, duration, 'elastic');
//            });
            //todo
            //todo
            //todo
            //todo this works though : (
            var props = self.transformation.orig;
            (function recurseAnimate() {
               if( i-- ) {
                  self.graphic().animate({transform: 'S'+props.scaleX+','+props.scaleY+','+','+props.x+','+props.y+' R'+(props.angle-rand(min, max))+','+props.x+','+props.y}, wind.duration, 'elastic', recurseAnimate);
               }
               else {
                  self.graphic().animate({transform: 'S'+props.scaleX+','+props.scaleY+','+','+props.x+','+props.y+' R'+props.angle+','+props.x+','+props.y}, wind.duration, 'elastic');
               }
            })();
         });
      }
      else {
         // leaf is not attached so it blows somewhere
         //todo
         //todo
         //todo
         throw new Error('I haven\'t been implemented for unattached leaves yet');
      }
   };


   /** WIND: a wind effect to apply to trees and leaves
    ******************************************************************/
   function Wind(strength, duration) {
      //todo add direction?
      this.strength = strength; //todo
      this.duration = duration; //todo
   }


   /** Color: a class for managing colors and hue shifts
    ******************************************************************/

   /**
    * Create a new random color within the configuration range
    * @param [h]
    * @param [s]
    * @param [l]
    * @constructor
    */
   function Color(h, s, l) {
      var def = Color.defaults;
      this.base = {
         hue: h || rand.apply(null, def.hue),
         sat: s || rand.apply(null, def.sat),
         lum: l || rand.apply(null, def.lum)
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

   /**
    * @param {number} newHue 0.0 to 1.0
    * @param {number} newSat 0.0 to 1.0
    * @param {number} newLum 0.0 to 1.0
    * @return {*}
    */
   Color.prototype.shiftHue = function(newHue, newSat, newLum) {
      //todo assumes hue/sat for gradient is same as base
      //todo if we modify the hue/sat for gradients, this will need to get changed
      this.base.hue = this.grad.hue = newHue;
      if( newSat && !isNaN(newSat) ) { this.base.sat = this.grad.sat = newSat; }
      if( newLum && !isNaN(newLum) ) {
         var diff = this.base.lum - this.grad.lum;
         this.base.lum = newLum;
         this.grad.lum = Math.max(0, Math.min(newLum - diff, 1));
      }
      return this;
   };

   Color.prototype.toHsl = function(gradientOffset) {
      var v = gradientOffset? this.grad : this.base;
      return sprintf('hsl(%f, %f, %f)', v.hue, v.sat, v.lum);
   };

   Color.prototype.toGrad = function() {
      return '25-'+this.toHsl()+'-'+this.toHsl(true);
   };

   Color.prototype.restore    = function() {
      var cp = this.checkpointData;
      if( cp ) {
         this.base = cp.base;
         this.grad = cp.grad;
      }
      return this;
   };

   Color.prototype.checkpoint = function() {
      this.checkpointData = {
         base: $.extend({}, this.base),
         grad: $.extend({}, this.grad)
      };
      return this.checkpointData;
   };


   /** TRANSFORM: A simple utility for applying transforms sequentially
    *  since Raphael resets back to the original path if you try to do
    *  them one after another. This, on the contrary, will remember the
    *  most recent settings.
    ******************************************************************/

   function Transformation(props) {
      this.orig = $.extend({
         x: 0,
         y: 0,
         angle: 0,
         scaleY: 1,
         scaleX: 1
      }, props);
      this.current = $.extend({}, this.orig);
   }

   Transformation.prototype.scale = function(scaleX, scaleY) {
      var curr = this.current;
      curr.scaleX = _adjustableNumber(scaleX, curr.scaleX, 0);
      curr.scaleY = ( arguments.length == 1 )? curr.scaleX : _adjustableNumber(scaleY, curr.scaleY, 0);
      return this;
   };

   Transformation.prototype.skewX = function(percentAsDecimal) {
      return this.scale( this.scaleX * percentAsDecimal, this.scaleY );
   };

   Transformation.prototype.skewY = function(percentAsDecimal) {
      return this.scale( this.scaleX, this.scaleY * percentAsDecimal );
   };

   Transformation.prototype.rotate = function(degrees) {
      var curr = this.current;
      curr.angle = _adjustableNumber(degrees, curr.angle);
      return this;
   };

   Transformation.prototype.vertex = function(x, y) {
      var curr = this.current;
      curr.x = _adjustableNumber(x, curr.x);
      curr.y = _adjustableNumber(y, curr.y);
      return this;
   };

   Transformation.prototype.update = function(props) {
      $.extend(this.current, props);
      return this;
   };

   Transformation.prototype.reset = function() {
      this.current = $.extend({}, this.orig);
      return this;
   };

   Transformation.prototype.checkpoint = function() {
      this.orig = $.extend({}, this.current);
      return this;
   };

   Transformation.prototype.toString = function() {
      var c = this.current,
          xyString = ',' + c.x + ',' + c.y;
      console.log('transform string', 'S'+c.scaleX+','+c.scaleY+xyString+' R'+c.angle+xyString);//debug
      return 'S'+c.scaleX+','+c.scaleY+xyString+' R'+c.angle+xyString;
   };

   Transformation.prototype.apply = function(graphic) {
      graphic.transform(this.toString());
      return this;
   };

   /**
    * @param {Raphael}   graphic
    * @param {object}   [moreAnimProps]
    * @param {int}      [duration]
    * @param {string}   [easing]
    * @return {jQuery.Deferred} promise
    */
   Transformation.prototype.animate = function(graphic, moreAnimProps, duration, easing) {
      var args = _transformAnimateArgs($.makeArray(arguments));
      return $.Deferred(function(def) {
         console.log('animation started', args);
         args.graphic.animate($.extend({transform: this.toString()}, args.more), args.duration, args.easing, function() {
            console.log('animate done');
            def.resolve();
         });
      }).promise();
   };


   /**
    * MAKE IT DO
    **********************************************************************/

   // generate the leaves
   var TREE = new Tree(PAPER);
   for(var i=0; i < 10; i++) {
      TREE.addLeaf();
   }

   //animate the leaves
      TREE.changeSeason(['-='+Color.defaults.run, 1], 8000, function() {
         //TREE.applyWind(new Wind(.5, 1000));
      });

   setTimeout(function() {
      TREE.applyWind(new Wind(1, 50));
   }, 1500);

//   var shiftInterval = setInterval(shiftHue, 10);

   //debug track mouse movement
   $PAPER.on('mousemove', function(e) {
      var off = $PAPER.offset();
      $('#log').text('x: '+ (e.pageX-off.left) +', y: '+ (e.pageY - off.top));
   });


   /**
    * UTILITIES
    **********************************************************************/

   /**
    * Round numbers or decimals
    * @param {number} num
    * @param {int}   [digits]
    * @return {Number}
    */
   function round(num, digits) {
      var p = Math.pow(10, digits);
      return digits? Math.round(num * p) / p : Math.round(num);
   }

   /**
    * Create a random number within a range. Works with negatives and decimals.
    *
    * @param {number} [min] min value inclusive (defaults to 0)
    * @param {int} max   max value inclusive
    * @param {int} [dec] decimal places (defaults to 0), must declare min to use this argument
    * @return {Number}
    */
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

   /**
    * Apply defaults to an object. If any of the attributes are a function, invoke it and use the returned value
    * @param  {object} defaults
    * @param  {object} customAttributes
    * @return {object}
    */
   function _opts(defaults, customAttributes) {
      var vals = $.extend(true, {}, defaults, customAttributes);
      _evalFxns(vals);
      return vals;
   }

   /**
    * Find any functions, invoke them, and replace them with the returned value.
    *
    * SIDE EFFECT: modifies `vals`
    *
    * @param {object} vals
    * @private
    */
   function _evalFxns(vals) {
      for (var k in vals) {
         if (vals.hasOwnProperty(k)) {
            if( typeof(vals[k]) === 'object' && vals[k] ) {
               _evalFxns(vals[k]);
            }
            else if( typeof(vals[k]) === 'function' ) {
               vals[k] = vals[k]();
            }
         }
      }
   }

   /**
    * @param {Arguments} argList
    * @return {object}
    * @private intended only for use by Tree.prototype.changeSeason
    */
   function _makeArgsChangeSeason(args) {
      var out = {attr: args.shift(), duration: 8000}, a;
      while(args.length) {
         a = args.shift();
         switch(typeof(a)) {
            case 'function':
               out.callback = a;
               break;
            case 'number':
               out.duration = a;
               break;
            default:
               throw new Error('unexpected argument '+a);
         }
      }
      if( typeof(out.attr) !== 'object' || !out.attr ) { throw new Error('{object} `props` must be first argument for changeSeasons'); }
      return out;
   }

   /**
    * @param values
    * @param base
    * @return {Array}
    * @private intended use by _makeArgsChangeSeason only
    */
   function _adjustHueArray(values, base) {
      var k, out = [], i = -1, len = values.length;
      for (k in base) {
         if(base.hasOwnProperty(k) && ++i < len) {
            out.push(_adjustableNumber(values[i], base[k], 0, 1))
         }
      }
      return out;
   }

   /**
    * Parses a value and adds it to base or replaces it. The action taken depends on the format of `v`. If `v` is a
    * string, then it is in the format '-=00.00' or '+=00.00' where 00.00 represents the amount to subtract or
    * add onto `base`
    *
    * If it is a number, then `base` is replaced with the new value. If the number exceeds `min` or `max` (assuming
    * they are provided), then
    *
    * @param {number|string} v
    * @param {number}        base
    * @param {number}        [min]
    * @param {number}        [max]
    * @return {number}
    * @private
    */
   function _adjustableNumber(v, base, min, max) {
      if( typeof(v) == 'string' ) {
         var m = v.match(/^([+-])=([\d.]+)$/);
         if( m ) {
            v = base + parseFloat(m[2]) * (m[1]=='-'? -1 : 1);
         }
         else {
            v = parseFloat(v);
         }
      }
      if( min !== undef ) { v = Math.max(v, min); }
      if( max !== undef ) { v = Math.min(v, max); }
      return v;
   }

   /**
    * @param {Array} argList the arguments to parse
    * @return {Object}
    * @private intended for Transformation.prototype.animate only
    */
   function _transformAnimateArgs(argList) {
      var out = {graphic: argList[0]}, i = argList.length;
      while(i-- > 1) {
         switch(typeof(i)) {
            case 'object':
               out.more = argList[i];
               break;
            case 'number':
               out.duration = argList[i];
               break;
            case 'string':
               out.easing = argList[i];
               break;
         }
      }
      return out;
   }

});