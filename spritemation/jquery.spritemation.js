
(function($) {

   /**
    * @param {object|int} [opts]
    * @param {int}        [duration] can also be declared in opts
    */
   $.fn.spritemation = function(opts, duration) {
      if( duration ) {
         if( typeof(opts) !== 'object' ) {
            opts = {end: opts};
         }
         opts.duration = duration;
      }
      return this.each(function() {
         var $this = $(this), args = _getArgs(opts, $this);
         console.log(_bgPos(args, args.end));
         $this.css('background-position', _bgPos(args, args.end));
      });
   };

   function _getArgs(opts, $this) {
      if( typeof(opts) === 'number' ) { opts = {end: opts}; }
      var w = $this.outerWidth(), h = $this.outerHeight();
      return $.extend({
         frameWidth: w,
         frameHeight: h,
         vertical: false,
         start: _calcBgOffset($this, h, w, (opts && opts.vertical)),
         end: 0,
         fps: 30
      }, opts);
   }

   function _bgPos(args, step) {
      return [
         (args.vertical? 0 : _calcBgPx(args, step, false)),
         'px',
         ' ',
         (args.vertical? _calcBgPx(args, step, true) : 0),
         'px'
      ].join('');
   }

   function _calcBgPx(args, step, vertical) {
      return vertical? args.frameHeight * -step : args.frameWidth * -step;
   }

   function _calcBgOffset($e, h, w, vertical) {
      var bgPos = $e.css('background-position'), idx = vertical? 2 : 1;
      console.log(bgPos);
      var val = 0, m = bgPos && bgPos.match(/^(-?[0-9]+(?:px|em|%)?) ?(-?[0-9]+(?:px|em|%)?)?$/);
      if( m && vertical ) {
         val = Math.floor(Math.abs($.UnitConverter.px($e, m[2])/h));
      }
      else if( m ) {
         val = Math.floor(Math.abs($.UnitConverter.px($e, m[1])/w));
      }
      return val;
   }

})(jQuery);

