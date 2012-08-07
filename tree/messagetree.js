
(function($) {

   $.fn.tree = function(dest, config) {
      var $dest = $(dest);
      return this.each(function() {
         var opts = $.extend(true, {}, defaults, config);
         new Tree($(this), $dest, opts);
      });
   };

   var defaults = $.fn.tree.defaults = {
      stepsMin:       5,
      stepsMax:      10,
      depth:        .25,
      leaves:         3,
      maxFall:        4,
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
            gust: ['spin',  'shoot', 'skip', 'jump']
         },
         ending: {
            calm: ['landingSoft'],
            rise: ['landBump', 'landSkip'],
            fall: ['landBump', 'landSkip', 'landSoft'],
            gust: ['landBounce', 'landWheel']
         }
      },
      leaf: {
         shapes:    ['leaf.png', 'leaf1.png', 'leaf2.png'],
         tpl:       '<img src="{shape}" class="leaf" />'
      },
      effects: {} // filled in below
   };

   var leafId = 0;

   function Leaf(startPoint, config, tree) {
      var self = this;
      this.id = ++leafId;
      this.$e = _leafElement(config).appendTo('body').offset(startPoint).click(function() {
         tree.leafClicked(self);
      });
      this.falling = false;
      this.fallen = false;
      this.showing = false;
      this.paused = $.Deferred().resolve(); // a placeholder so we don't have to if( paused ) everywhere
   }

   Leaf.prototype.shake = function(state) {
      console.log('shaking leaf ', this.id);
      //todo
      //todo
      //todo
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
         $(this).remove();
      });
      this.$e = null;
      //todo
      //todo
      //todo
   };

   function Tree($target, $landingZone, config) {
      //todo start interval timer
      //todo add some leaves
      //todo
      this.config         = config;
      this.round          = 0;
      this.currentRound   = null;
      this.upcomingRounds = _initRounds(config.stepsMax, config.round);
      this.hangingLeaves  = _initLeaves(this, config.leaves, $.extend({}, config.leaf, {start: _box($target), end: _box($landingZone)}));
      this.fallenLeaves   = [];
      this.unshownLeaves  = []; //add leaves not displayed yet here, they get appended
      this.nextRound();
   }

   Tree.prototype.nextRound = function() {
      this.round++;
      this.upcomingRounds.splice(0, 1);
      this.upcomingRounds.push(new Round(this.config.round, this.round));
      this.currentRound = this.upcomingRounds[0];
      console.log('starting round ', this.round);
      //todo determine state
      //todo break loose leaves as needed
      //todo add leaves as needed
      //todo clean the pile as needed
      //todo add a future round
      //todo pop last round
   };

   Tree.prototype.getRound = function(futureOrCurrentRound) {
      return this.upcomingRounds[futureOrCurrentRound - this.round];
   };

   Tree.prototype.dropLeaf = function(leaf) {
      console.log('dropping leaf: ', leaf.id, leaf.falling, leaf.fallen);
      var idx = $.inArray(leaf, this.hangingLeaves);
      if( idx >= 0 ) {
         this.hangingLeaves.splice(idx, 1);
         this.fallenLeaves.push(leaf);
         applyTricks(this.upcomingRounds, this.config.stepsMin, leaf)
               .fail(function(e) { console.error(e); });
      }
   };

   Tree.prototype.leafClicked = function(leaf) {
      console.log('leafClicked', leaf.id);
      if( leaf.falling || leaf.fallen ) {
         if( leaf.showing ) {
            leaf.hideMessage();
         }
         else {
            leaf.showMessage();
         }
      }
      else {
         this.dropLeaf(leaf);
      }
   };

   function Round(config, round) {
      this.state  = 'calm'; //todo
      this.length = config.length; //todo
      this.round  = round;
      this.config = config;
   }

   Round.prototype.getState = function() {
      return this.state;
   };

   Round.prototype.getTrick = function(percent) {
      return new Trick(this.state, this.length, percent, this.config);
   };

   function Trick(state, length, percent, config) {
      //todo
      //todo
      //todo
   }

   Trick.prototype.run = function(leaf) {
      return $.Deferred(function(def) {
         //todo
         //todo
         //todo
         //todo
         //todo
         var off = leaf.$e.offset();
         var path = {
            start: {
               x: off.left,
               y: off.top,
               angle: 25
            },
            end: {
               x:150+_rand(800),
               y: 445+_rand(10),
               angle: -30,
               length: 1
            }
         };
         leaf.$e.animate({
            path: new $.path.bezier(path),
            scale:.8,
            rotate: _rand(10)
         }, {duration: 3000, complete: def.resolve});
      });
   };

   function _box($e) {
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

   function _initLeaves(tree, count, config) {
      var list = [], i = -1;
      while(++i < count) {
         list.push(new Leaf(_start(config, i), config, tree)); //todo add random rotation for variance
      }
      return list;
   }

   function _start(config, i) {
      var conf = {top: config.start.top+125+i*25, left: config.start.left + 125 + i*100};
      console.log('start', conf, i);
      return conf; //todo
   }

   function _leafElement(config) {
      var shape = _pickOne(config.shapes);
      console.log('leafElement', shape, config.tpl.replace('{shape}', shape));
      return $(config.tpl.replace('{shape}', shape));
   }

   function _pickOne(list) {
      return list[ _rand(list.length-1) ];
   }

   function _rand(min, max) {
      if( arguments.length < 2 ) {
         max = min;
         min = 0;
      }
      return Math.floor(Math.random() * (max - min + 1)) + min;
   }

   function applyTricks(rounds, min, leaf) {
      var i=-1, max = _rand(min, rounds.length-1);
      var def = $.Deferred().resolve();
      max = 1; //debug
      while(++i < max) {
         def = def.pipe(deferTrick(rounds[i], i, max, leaf));
      }
      def.always(function() {
         leaf.fallen = true;
         leaf.falling = false;
      });
      return def.promise();
   }

   function deferTrick(round, idx, end, leaf) {
      return function() {
         return leaf.paused.then(round.getTrick().run(leaf, idx, end));
      }
   }

})(jQuery);