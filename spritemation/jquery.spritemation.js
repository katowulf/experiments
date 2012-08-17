
(function($) {
   /**
    * The spritemation plugin animates CSS sprites (background images on a DOM element which are larger than the element's
    * viewable portal) through a sequence of frames to create the illusion of transitions or movement.
    *
    * If you are not familiar with CSS sprites, begin by learning about those:
    * http://www.noobcube.com/tutorials/html-css/css-background-image-sprites-a-beginners-guide-/
    * http://nicolasgallagher.com/css-background-image-hacks/
    *
    * It can be called in one of two ways: spritemation( endStep, duration ) or spritemation( opts )
    *
    * Examples:
    * <code>
    *    // cycle from frame 0 to frame 10 in 1 second (at 10 fps)
    *    $('#sprite').spritemation( 10, 1000 );
    *
    *    // or...
    *    $('#sprite').spritemation( { end: 10, fps: 100 } );
    *
    *    // cycle backward from frame 10 to 1 in 1 second (at 10 fps)
    *    $('#sprite').spritemation( { start: 10, end: 5 }, 1000 );
    *
    *    // or...
    *    $('#sprite').spritemation( { start: 10, end: 5, fps: 10 } );
    *
    *    // or...
    *    $('#sprite').spritemation( { start: 10, end: 5, duration: 1000 } );
    *
    *    // just show the 4th frame without any animation (with duration of zero)
    *    $('#sprite').spritemation( 4, 0 );
    *
    * </code>
    *
    *
    * `opts` accepts any of the following arguments:
    *
    *    {int}      end        (default=0) which frame are we going to animate to?
    *    {int}      fps        (default=10) how fast should we animate? (frames per second)
    *    {int}      duration   (default=null) how long should we animate? (milliseconds, see below)
    *    {int}      cycles     (default=1) see below
    *    {string}   cycleType  (default="restart") "restart" or "modulate", see below
    *    {function} callback  {default=null} executed when animation completes, receives final frame position
    *
    * The spritemation automatically calculates the following arguments. It doesn't probably make sense to
    * override any of them unless you want the animations to act weird, but you could do so as an (unnecessary)
    * optimization if they happen to be known already.
    *
    *    {int}     frameWidth   the width of the visible pane (of one frame of the sprite image)
    *    {int}     frameHeight  the height of the visible pane (of one frame of the sprite image)
    *    {int}     start        which frame to begin the animation from
    *    {boolean} vertical     is this sprite vertically oriented?
    *
    * ANIMATION LENGTH AND SPEED
    * --------------------------
    * For convenience, there are two ways to control the speed of the animation. If you want it to run in parallel with
    * some other animations, you can utilize the `duration`, which will ensure they start and stop at the same time.
    *
    * However, this causes it to animate faster/slower depending on how far it's travelling (in other words, it has
    * to get from 0-10 in the same amount of time that it gets from 0-5). If that's undesirable, you can utilize the
    * `fps` argument to set how fast each frame should tick by.
    *
    * In the case that both exist, `duration` takes precedence, except when using the cycle option (see below).
    *
    * CYCLING FRAMES
    * --------------
    * It's possible to make spritemation "modulate" (go back and forth) through the frames or to "restart" the frames
    * by using the `cycles` option. Examples:
    * <code>
    *    // cycle frames 9-0 (backwards), a total of 10 times (100 frames) in 1 second, starting back at 9 each time 0 is reached
    *    spritemation({ start: 9, end: 0, cycles: 10 }, 1000 );
    *
    *    // modulate frames 1-10 a total of 5 times each direction (100 frames) in 1 second, reversing from 10-1 before going forward again
    *    spritemation({ start: 1, end: 10, cycles: 5, cycleType: 'modulate' }, 1000 );
    * </code>
    *
    * Note that above we specified the start position, which would override the default. This would automagically happen
    * if the sprite was already positioned at the correct pixels for frame 9.
    *
    * @param {object|int} [opts] see above
    * @param {int}        [duration] can also be declared in opts
    */
   $.fn.spritemation = function(opts, duration) {
      return this.each(function() {
         var $this = $(this);
         // we may have to load an image to get the args, so wait to resolve
         // before we continue
         _getArgs(opts, duration, $this).then(function(args) {
            var to, it = new CycleIterator(args);
            if( args.duration === 0 ) {
               // show a frame number without any animation (with duration zero)
               console.warn('just set frame', args.end);
               $this.css('background-position', _bgPos(args, args.end));
               if( args.callback ) { args.callback(args.end); }
            }
            else {
               console.warn('launching spritemation', args);
               // animate and display the frame
               if( it.hasNext() ) {
                  to = setInterval(function() {
                     var frame = it.next();
                     console.log({frame: frame, step: 1000/args.fps, args: args});
                     $this.css('background-position', _bgPos(args, frame));
                     if( !it.hasNext() ) {
                        console.timeEnd($this);
                        clearInterval(to);
                        if( args.callback ) { args.callback(frame); }
                     }
                  }, 1000/args.fps);
               }
               else {
                  if( typeof(console) === 'object' && console.warn ) {
                     console.warn('nothing to iterate (does start == end?)');
                  }
               }
            }
         });
      });
   };

   /** ITERATOR
    ******************************************************************/

   function CycleIterator(args) {
      this.start      = Math.min(args.start, args.end);
      this.end        = Math.max(args.start, args.end);
      this.frames     = this.end - this.start + 1; // inclusive, so add 1
      this.modulate   = !!(args.cycleType === 'modulate');
      this.maxSteps   = this.frames * args.cycles;
      this.direction  = args.start > args.end? -1 : 1;
      this.curStep    = -1;
      this.curFrame   = this.direction < 0? this.end : this.start;
      console.log($.extend({}, this), $.makeArray(args));
   }

   CycleIterator.prototype.next = function() {
      if( this.hasNext() ) {
         this.curStep++;
         if( this.modulate ) {
            if( (this.direction > 0 && this.curFrame === this.end)
                || (this.direction < 0 && this.curFrame === this.start) ) {
               this.direction = -(this.direction);
            }
            this.curFrame = this.curFrame + this.direction;
         }
         else {
            var amt = this.curStep % this.frames;
            if( this.direction < 0 ) {
               this.curFrame = this.end - amt;
            }
            else {
               this.curFrame = this.start + amt;
            }
         }
         console.log('next()', this.curFrame);
         return this.curFrame;
      }
      else {
         console.error('next() called after last frame');
         return false;
      }
   };

   CycleIterator.prototype.hasNext = function() {
      return this.curStep < this.maxSteps-1;
   };

   CycleIterator.prototype.reset = function() {
      this.curStep = -1;
      this.curFrame = this.direction < 0? this.end : this.start;
   };

   /** UTILITIES
    ******************************************************************/

   function _getArgs(opts, duration, $this) {
      return $.Deferred(function(def) {
         var cache = $this.data('spritemation');

         // opts might be an integer value
         if( opts && typeof(opts) !== 'object' ) { opts = {end: ~~opts}; }
         // or opts might not even exist
         else if( !opts ) { opts = {}; }
         // duration might be declared as another arg or in opts
         if( typeof(duration) === 'number' || typeof(duration) === 'string' ) { opts.duration = ~~duration; }

         // apply the defaults, override with any declared options
         var undef, args = $.extend({
            start: undef,
            end: 0,
            frameHeight: undef,
            frameWidth: undef,
            vertical: undef,
            fps: 30,
            cycles: 1,
            cycleType: 'restart'
         }, cache, opts);

         function _resolveArgs(isVertical) {
            args.vertical = isVertical;
            if( !args.frameWidth ) { args.frameWidth = $this.outerWidth(); }
            if( !args.frameHeight ) { args.frameHeight = $this.outerHeight(); }
            if( args.start === undef ) {
               args.start = _calcBgOffset($this, args.frameHeight, args.frameWidth, args.vertical);
               console.log('calculating start', args.start);
            }

            var span = Math.abs(args.end - args.start)+1; // inclusive, so add 1

            if( args.duration ) {
               // if there is a duration, then the fps needs to be calculated to ensure we reach args.end
               // exactly at end of the animation
               var frames = span * args.cycles;

               // if we are going to modulate, then the total steps is doubled (we come back once for each cycle)
               if( args.cycleType === 'modulate' ) { frames *= 2; }

               // teh maths: a second, divided by the duration times number of steps
               opts.fps = Math.round( 1000 / duration * frames );
            }
            else if( args.duration !== 0 ) {
               // teh maths: duration is the length of a frame (1000/fps) times number of frames (span) times number of cycles
               args.duration = (1000 / opts.fps) * span * args.cycles * (args.cycleType === 'modulate'? 2 : 1);
            }

            if( !cache ) {
               $this.data('spritemation', {
                  frameHeight: args.frameHeight,
                  frameWidth: args.frameWidth,
                  vertical: args.vertical
               })
            }

            def.resolve(args);
         }

         if( 'vertical' in opts ) {
            _resolveArgs(opts.vertical);
         }
         else {
            // only calculate this if it is not already declared; we have to load an image and potentially
            // perform an http request, which could turn out to be expensive
            _isVertical($this).then(_resolveArgs);
         }
      });
   }

   function _isVertical($e) {
      return $.Deferred(function(def) {
         var imgUrl = $e.css('background-image');//, $img = $('<img />');
         $('<img />').hide().appendTo('body').on('load', function() {
            console.log('image loaded', $(this).height(), $(this).width(), imgUrl.substr(5, imgUrl.length-7));
            def.resolve($(this).height() > $(this).width());
            $(this).remove();
         }).attr('src', imgUrl.substr(5, imgUrl.length-7));

   //      $img.attr('src', imgUrl.substr(5, imgUrl.length-7));
   //      console.log(imgUrl.substr(5, imgUrl.length-7), $img.height(), $img.width());
   //      $img.load(function() {
   //         console.log('loaded', imgUrl.substr(5, imgUrl.length-7), $img.height(), $img.width());
   //      });

      });
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
      var bgPos = $e.css('background-position'), side = vertical? h : w;
      console.log(bgPos);
      var m = bgPos && bgPos.match(/^(-?[0-9]+(?:px|em|%)?) ?(-?[0-9]+(?:px|em|%)?)?$/);
      console.log('_calcBgOffset', {m: m, px: $.UnitConverter.px($e, m[2]), side: side});
      return m? Math.floor(Math.abs( $.UnitConverter.px($e, m[2]) / side )) : 0;
   }

   /**
    * Ensure a number stays within a given range
    *
    * @param {number} num
    * @param {number} min
    * @param {number} max
    * @return {number}
    */
   function range(num, min, max) {
      if( min > max ) {
         //switch em
         min = min^max;
         max = min^max;
         min = min^max;
      }
      return Math.max(min, Math.min(max, num));
   }

})(jQuery);

