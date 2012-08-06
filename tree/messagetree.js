
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
            calm: ['float', 'rock', 'rise'],
            rise: ['float', 'flip', 'spin', 'jump'],
            fall: ['float', 'drop', 'spin', 'flip'],
            gust: ['sine', 'flip', 'spin', 'shoot', 'skip']
         },
         ending: {
            calm: ['landingSoft'],
            rise: ['landBump', 'landSkip'],
            fall: ['landBump', 'landSkip', 'landSoft'],
            gust: ['landSkip', 'landCaught', 'landBounce']
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
      this.launchPoint  = startPoint;
      this.currStep     = 0;
      this.tricks       = null;
      this.pause        = $.Deferred().resolve();
   }

   Leaf.prototype.shake = function(state) {
      console.log('shaking leaf ', this.id);
      //todo
      //todo
      //todo
   };

   Leaf.prototype.showMessage = function() {
      this.pause();
      console.log('showMessage', this.id);
      //todo
      //todo
      //todo
   };

   Leaf.prototype.hideMessage = function() {
      this.unpause();
      console.log('hideMessage', this.id);
      //todo
      //todo
      //todo
   };

   Leaf.prototype.pause = function() {
      if( !this.isPaused() ) {
         console.log('pause', this.id);
         this.pause = $.Deferred();
      }
   };

   Leaf.prototype.unpause = function() {
      if( this.isPaused() ) {
         console.log('unpause', this.id);
         this.pause.resolve();
      }
   };

   Leaf.prototype.fall = function(tricks) {
      //todo make this return a promise
      var self = this;
      self.tricks = tricks;
      console.log('falling leaf ', this.id);
      //todo
      //todo use promises to run tricks
      //todo handle pause and unpause
      //todo notify Tree when completely fallen
   };

   Leaf.prototype.isFalling = function() { return this.tricks !== null && this.tricks.length; };
   Leaf.prototype.isFallen  = function() { return this.tricks !== null && !this.tricks.length; };
   Leaf.prototype.isPaused  = function() { return !this.pause.isResolved(); };

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
      console.log('dropping leaf: ', leaf.id, leaf.isFalling(), leaf.isFallen());
      var idx = $.indexOf(leaf, this.hangingLeaves);
      if( idx >= 0 ) {
         this.hangingLeaves.splice(idx, 1);
         this.fallenLeaves.push(leaf);
         leaf.fall(buildTricks(this.upcomingRounds, this.config.stepsMin));
      }
   };

   Tree.prototype.leafClicked = function(leaf) {
      console.log('leafClicked', leaf.id);
      if( leaf.isFalling() ) {
         if( leaf.isPaused() ) {
            leaf.hideMessage();
         }
         else {
            leaf.showMessage();
         }
      }
      else if( !leaf.isFallen() ) {
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
      
   }

   function Trick.prototype.run(leaf) {
      return $.Deferred(function(def) {
         //todo
         //todo
         //todo
         //todo
         //todo
         leaf.$e.animate({

         }, {duration: 1000});
      });
   }

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
      console.log('start', {top: config.start.top, left: config.start.left + i*25}, i);
      return {top: config.start.top, left: config.start.left + i*50}; //todo
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

   function buildTricks(rounds, min) {
      var i=-1, max = _rand(min, rounds.length-1), tricks = [];
      while(++i < max) {
         tricks.push(rounds[i].getTrick((i+1)/max));
      }
      return tricks;
   }

})(jQuery);