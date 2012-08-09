
(function($) {

   /**
    * Turn a box into a tree. The element `tree` is called on is the tree, where `dest` is where the leaves are
    * going to land.
    *
    * @param {jQuery} landingZone selector representing the element to apply tree effect to
    * @param {object} config see $.fn.tree.defaults; any can be overridden globally or per call to $.fn.tree
    * @return {*}
    */
   $.fn.tree = function(landingZone, config) {
      var $zone = $(landingZone);
      return this.each(function() {
         var opts = $.extend(true, {}, defaults, config);
         new Controller($(this), $zone, opts);
      });
   };

   /**
    * The global configuration for $.fn.tree
    * @type {Object}
    */
   var defaults = $.fn.tree.defaults = {
      stepsMin:       5,
      stepsMax:      10,
      depth:        .25,
      maxFall:        4,
      trailers:    true, //debug debugging trails from leaves
      // `stems` defines offsets in 'tree' element where leaves may be attached
      // each entry is an array containing: [ top, left, angle ] for leaf to be attached
      //todo use config to do this somehow; allocate "branches" as x,y coord lines with spaced attach points?
      stems:         [],
      round: {
         length:   1000,
         variance:   .5,
         wind: {
            min:        10,
            max:        50,
            gusts:     .25
         },
         states: {
            calm: ['float', 'flip', 'drop'],
            rise: ['float', 'spin', 'jump'],
            fall: ['float', 'drop', 'spin'],
            gust: ['spin',  'shoot', 'jump']
         },
         ending: {
            calm: ['landingSoft'],
            rise: ['landBump', 'landSkip'],
            fall: ['landBump', 'landSoft'],
            gust: ['landBounce', 'landWheel']
         }
      },
      leaf: {
         shapes:    ['leaf.png', 'leaf1.png', 'leaf2.png'],
         tpl:       '<img src="{shape}" class="leaf" />'
      },
      effects: {} // filled in below
   };

   /**
    * Position an element on the page relative to another
    * When the window is resized, keep them synced in location
    * If the element has class "moving" then leave it alone
    *
    * @param {jQuery} relativeTo  the reference point
    * @param {object} offset passed directly to $.fn.offset(), position relative to `relativeTo`
    */
   $.fn.offsetResizeTolerant = function(relativeTo, offset) {
      var $this = $(this), $ref = $(relativeTo);
      var fx = function() {
         $this.offset(offsetFrom($ref, offset));
      };
      $this.offset(offsetFrom($ref, offset)).data('offsetResizeTolerant', {
         relativeTo: relativeTo,
         offset:     offset,
         dispose: function() {
            $(window).off('resize', fx);
         }
      });
      $(window).on('resize', fx);
      return this;
   };

   var leafId = 0; // just for debugging

   function Leaf(config) {
      var self         = this;
      this.id          = ++leafId;
      this.$e          = _leafElement(config).hide().appendTo('body');
      this.attached    = false;
      this.grounded    = false;
      this.showing     = false;
      this.attachPoint = null;
      this.width       = this.$e.outerWidth();
      this.height      = this.$e.outerHeight();
      console.log('Leaf', this.id, this.$e, config);
   }

   Leaf.prototype.position = function(ref, offset) {
      if( arguments.length > 0 ) {
         var w = this.$e.width(), h = this.$e.height();
         this.$e.offsetResizeTolerant(ref, offset);
      }
      return this.$e.offset();
   };

   Leaf.prototype.showMessage = function() {
      this.pause();
      this.showing = true;
      console.log('showMessage', this.id);
      //todo
      //todo
      //todo
   };

   Leaf.prototype.hideMessage = function() {
      this.unpause();
      this.showing = false;
      console.log('hideMessage', this.id);
      //todo
      //todo
      //todo
   };

   Leaf.prototype.dispose = function() {
      console.log('disposing leaf', this.id);
      this.$e.fadeOut(function() {
         var off = $(this).data('offsetResizeTolerant');
         off && off.dispose && off.dispose();
         $(this).remove();
      });
      this.$e = null;
      this.grounded = true;
      //todo
      //todo
      //todo
   };

   function Tree($target, config) {
      //todo start interval timer
      //todo add some leaves
      //todo
      this.config    = config;
      this.holders   = {free: _createAttachPoints(config, $target), filled: []};
      this.$target   = $target;
   }

   /**
    * Release a spot, making it available for another leaf to reserve
    * @param spot
    */
   Tree.prototype.release = function(spot) {
      var idx = _.indexOf(this.holders.filled, spot);
      if( idx >= 0 ) {
         this.holders.free.push(spot);
         removeFromList(this.holders.filled, spot);
      }
   };


   /**
    * Reserve a spot on a branch where a leaf can be placed
    *
    * @private
    */
   Tree.prototype.reserve = function() {
      var holders = this.holders, newPoint = holders.free.shift();
      holders.filled.push(newPoint);
      return newPoint;
   };

   function Controller($target, $landingZone, config) {
      console.log({name: 'tree', height: $target.outerHeight(), width: $target.outerWidth(), top: $target.offset().top, left: $target.offset().left, bottom: $target.offset().top + $target.outerHeight(), right: $target.offset().left + $target.outerWidth()}); //debug
      this.tree = new Tree($target, config);
      this.round          = 0;
      this.config         = config;
      this.currentRound   = null;
      this.upcomingRounds = _initRounds(config.stepsMax, config.round);
      this.hangingLeaves  = _attachLeaves(this, $target, this.tree, config);
      this.fallenLeaves   = [];
      //todo can we remove this to avoid possibility of memory leaks? (would need a `box` that resizes on window resize)
      this.$landingZone   = $landingZone;
      this.unshownLeaves  = []; //add leaves not displayed yet here, they get appended
      this.nextRound();
   }

   Controller.prototype.nextRound = function() {
      this.round++;
      this.upcomingRounds.splice(0, 1);
      this.upcomingRounds.push(new Round(this.config.round, this.round));
      this.currentRound = this.upcomingRounds[0];
      console.log('starting round ', this.round);
      //todo break loose leaves as needed
      //todo add leaves from unshownLeaves as needed
      //todo clean the pile as needed
      //todo shake leaves as needed
   };

   Controller.prototype.dropLeaf = function(leaf) {
      var idx = _.indexOf(this.hangingLeaves, leaf);
      if( removeFromList(this.hangingLeaves, leaf) && leaf.attached ) {
         console.log('dropping leaf');
         //todo limit the number of leaves on the ground
         this.fallenLeaves.push(leaf);
         leaf.attached = false;
         return fall(leaf, this.$landingZone, _sliceRounds(this.upcomingRounds, this.config.stepsMin));
      }
   };

   Controller.prototype.event = function(e, leaf) {
      console.log(e.type);
      switch(e.type) {
         case 'click':
            if( leaf.attached ) { this.dropLeaf(leaf); }
            break;
         case 'mouseenter':

            break;
         case 'mouseleave':

            break;
         default:
            console.warn('I don\'t know what to do with this event type', e.type);
      }
   };

   function Round(config, roundNumber) {
      this.length      = config.length; //todo
      this.roundNumber = roundNumber;
      this.force       = 10;            //todo wind strength
      this.direction   =  0;            //todo rising or falling
      this.states      = config.states;
      this.endStates   = config.ending;
   }

   Round.prototype.assignEffect = function(isLastRound) {
      var choices = isLastRound? this.endStates : this.states;
      return pickOneFromList(choices);
   };

   Round.prototype.state = function() {
      switch(this.force) {
         case 0:
            return 'calm';
         case 1:
         case 2:
            return this.direction > 0? 'rise' : 'fall';
         case 3:
         case 4:
         case 5:
            return 'gust';
      }
   };

   function Effect(round, effectName) {
      //todo
      //todo
      //todo
      this.wind = round.force;
   }

   /**
    *
    * @param leaf
    * @param step
    * @param numberOfSteps
    * @return {*}
    */
   Effect.prototype.run = function(leaf, step, numberOfSteps, $landingZone, startFrom) {
      //todo
      //todo apply different effects based on wind
      //todo
      //todo
      //todo
      console.log('Effect.run()', leaf.id, step, numberOfSteps, startFrom);
      return $.Deferred(function(def) {
         var off = startFrom || leaf.$e.offset(),
             w   = leaf.$e.width()*.6, //todo-effects
             end = pickEndpoint(off, $landingZone, this.wind, step, numberOfSteps); //don't use startPoint; leaf may move/pause/resume/etc
         var path = {
            start: {
               x: off.left,
               y: off.top,
               angle: 25
            },
            end: {
               x: end.left,
               y: end.top,
               angle: -30,
               length: 1
            }
         };
         leaf.$e.animate({
            path: new $.path.bezier(path),
            scale:.8, //todo-effects
            width: w,
            rotate: rand(10)
         }, {
            duration: 3000,
            complete: function() { def.resolve(end) },
            step: _trailers(leaf.$e)
         });
      }).promise();
   };

   /**
    * Get a random slice of the rounds to use for creating animations. Since the number of available rounds is
    * assumed to always be the same as config.stepsMax, there is no need to pass that here.
    *
    * @param {Array} rounds of Round instances
    * @param {int}   min    from config.stepsMin
    * @private
    */
   function _sliceRounds(rounds, min) {
      return rounds.slice(0, rand(min, rounds.length));
   }

   /**
    * Calculate the boundaries of an element's bounding box.
    * This won't work as expected on things that are rotated or hidden using display: none
    *
    * @param $e
    * @return {Object}
    */
   function defineBox($e) {
      var off = $e.offset(), w = $e.outerWidth(), h = $e.outerHeight();
      return { top: off.top, bottom: off.top + h, left: off.left, right: off.left + w };
   }

   function _initRounds(count, config) {
      var list = [], i = 0;
      while(i++ < count) {
         list.push(new Round(config, i));
      }
      return list;
   }

   function _attachLeaves(control, $target, tree, config) {
      var list = [], i = -1, leaf,
          count = config.stems.length, // we have to fetch some leaves to determine this?
          leafConf = config.leaf;
      while(++i < count) {
         list.push(_attachLeaf(control, $target, tree, leafConf));
      }
      return list;
   }

   function _attachLeaf(control, $target, tree, leafConf) {
      var leaf = new Leaf($.extend({}, leafConf));
      var point = tree.reserve(), $e = leaf.$e;
      leaf.position($target, point.offset);
      $('<div class="marker-big" />').appendTo('body').offset(offsetFrom($target, point.offset));
      if( point.angle ) {
         $e.show().animate({rotate: '+=90deg', transformOriginX:'0%', transformOriginY:'0%'});
      }
      $e.slideDown(500); //todo config?
      leaf.attached = true;
      _monitor(control, leaf);
      return leaf;
   }

   // abstracted for scope (mutable leaf variable)
   function _monitor(control, leaf) {
      leaf.$e.on('click.ControllerEvents mouseenter.ControllerEvents mouseleave.ControllerEvents', function(e) {
         control.event(e, leaf);
      });
   }

   function _angle(config) {
      //todo
      //todo
      //todo
      return 30;
   }

   function _leafElement(config) {
      var shape = pickOneFromList(config.shapes);
      return $(config.tpl.replace('{shape}', shape));
   }

   function pickEndpoint(startOffset, $landingZone, wind, step, numberOfSteps) {
      //todo
      //todo
      //todo
      var box = defineBox($landingZone), vals = {top: rand(box.top, box.bottom), left: rand(box.left, box.right)};
      console.log('pickEndpoint', box, vals);
      return vals;
   }

   function pickOneFromList(list) {
      return list[ rand(list.length-1) ];
   }

   function rand(min, max, dec) {
      if (arguments.length < 2) {
         max = min;
         min = 0;
      }
      if (dec) {
         var p = Math.pow(10, dec);
         return Math.round((Math.random() * (max - min) + min) * p) / p;
      }
      else {
         return Math.floor(Math.random() * (max - min + 1)) + min;
      }
   }

   function offsetFrom($e, offset) {
      var base = $e.offset();
      return {left: base.left + offset.left, top: base.top + offset.top };
   }

   function distanceTo($e, coords) {
      var base = $e.offset();
      return {left: coords.left - base.left, top: coords.top - base.top };
   }

   function _deferEffect(effect, leaf, step, numberOfSteps, $zone) {
      return function(startFrom) {
         if( !startFrom ) { startFrom = leaf.$e.offset(); }
         return effect.run(leaf, step, numberOfSteps, $zone, startFrom);
      }
   }

   /**
    * Used by Tree to allocate spots where leaves can be attached. Not intended for re-use.
    *
    * @param {object} config
    * @param {object} box  the tree's box
    * @private
    */
   function _createAttachPoints(config, $target) {
      var leaves = _.toArray(config.stems), leaf,
          i = leaves.length,
          points = [];
//          h = $target.outerHeight(),
//          w = $target.outerWidth(),
//          ydiff = Math.floor(h/2); // only position leaves in the top half
      while(i--) {
         leaf = leaves.shift();
//       points.push({offset: {top: rand(ydiff), left: rand(w-50)}, angle: _angle(config)});
         points.push({offset: {top: leaf[0], left: leaf[1]}, angle: leaf[2]});
      }
      return points;
   }

   /**
    * Just a simple utility to remove an element from a list.
    * SIDE EFFECT: modifies list
    *
    * @param {object|Array} list
    * @param entry
    * @private
    */
   function removeFromList(list, entry) {
      var idx = _.indexOf(list, entry);
      if( idx >= 0 ) {
         list.splice(idx, 1);
         return true;
      }
      return false;
   }

   function _cancelOffsetResize($e) {
      var off = $e.data('offsetResizeTolerant');
      off && off.dispose && off.dispose();
   }

   /**
    * Perform falling action on a leaf
    * @param leaf
    * @param $landingZone
    * @param rounds
    * @return {*}
    * @private
    */
   function fall(leaf, $landingZone, rounds) {
      leaf.attached = false;
      rounds = rounds.slice(0, 1); //debug
      var i = -1, numberOfSteps = rounds.length;
      var def = $.Deferred().resolve();
      console.log('falling', numberOfSteps);
      while(++i < numberOfSteps) {
         console.log('falling: step '+(i+1)+' of '+numberOfSteps);
         def = def.pipe(_deferEffect(new Effect(rounds[i], rounds[i].assignEffect(i == numberOfSteps-1)), leaf, i, numberOfSteps, $landingZone)); //todo-effects
      }
      def.done(function(attachPoint) {
            console.log('done falling', attachPoint, $landingZone);
            leaf.grounded = true;
            var offset = distanceTo($landingZone, attachPoint);
            leaf.position($landingZone, offset);
         });
      return def.promise();
   }

   function _trailers($e) {
      if($.fn.tree.defaults.trailers) {
         return function() {
            console.log('step', $.makeArray(arguments));
            $('<div class="marker"></div>').appendTo('body').offset($e.offset());
         };
      }
      else {
         return null;
      }
   }

})(jQuery);