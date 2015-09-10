/**
 * <div cx-sortables>
 *   <div cx-sortable ng-repeat="item in list"></div>
 * </div>
 **/

angular.module('ng.cx.sortable', [])

.service('Draggable', [
  function () {
    'use strict';

    if (angular.isUndefined(window.Draggable)) {
      throw new Error('window.Draggable is undefined');
    }

    return window.Draggable;
  }
])

.service('TweenLite', [
  function () {
    'use strict';

    if (angular.isUndefined(window.TweenLite)) {
      throw new Error('window.TweenLite is undefined');
    }

    return window.TweenLite;
  }
])

.service('TimelineMax', [
  function () {
    'use strict';

    if (angular.isUndefined(window.TimelineMax)) {
      throw new Error('window.TimelineMax is undefined');
    }

    return window.TimelineMax;
  }
])

.factory('CxDraggable', [
  'Draggable',
  'TweenLite',
  function (Draggable, TweenLite) {
    'use strict';

    function CxDraggable($elem, $ctrl) {
      var colspan = $ctrl.getConfig('fixedSize') || $ctrl.getConfig('oneColumn') ? 1 : Math.floor(Math.random() * 2) + 1,
        tile = {
          col: null,
          colspan: colspan,
          height: 0,
          inBounds: true,
          index: null,
          isDragging: false,
          lastIndex: null,
          newTile: true,
          positioned: false,
          row: null,
          rowspan: 1,
          width: 0,
          x: 0,
          y: 0
        };

      this.$elem = $elem;
      this.$ctrl = $ctrl;

      this.tile = tile;
      this.lastX = 0;

      Draggable.call(this, this.$elem, {
        zIndexBoost: false
      });

      this.addEventListener('drag', this.onDrag, this);
      this.addEventListener('press', this.onPress, this);
      this.addEventListener('release', this.onRelease, this);
    }

    CxDraggable.prototype = Object.create(Draggable.prototype);
    CxDraggable.constructor = CxDraggable;

    CxDraggable.prototype.onDrag = function () {
      var tile = this.tile,
        tiles = this.$ctrl.getDraggables(),
        i,
        testTile,
        onSameRow,
        rowToUpdate,
        shiftLeft,
        shiftRight,
        validMove;

      // Move to end of list if not in bounds
      if (!this.hitTest(this.$ctrl.$container, 0)) {
        tile.inBounds = false;
        this.$ctrl.changePosition(tile.index, tiles.length - 1);
        return;
      }

      tile.inBounds = true;

      for (i = 0; i < tiles.length; i += 1) {
        // Row to update is used for a partial layout update
        // Shift left/right checks if the tile is being dragged
        // towards the the tile it is testing
        testTile = tiles[i].tile;
        onSameRow = (tile.row === testTile.row);
        rowToUpdate = onSameRow ? tile.row : -1;
        shiftLeft = onSameRow ? (this.x < this.lastX && tile.index > i) : true;
        shiftRight = onSameRow ? (this.x > this.lastX && tile.index < i) : true;
        validMove = (testTile.positioned && (shiftLeft || shiftRight));

        if (this.hitTest(tiles[i].$elem, this.$ctrl.getConfig('threshold')) && validMove) {
          this.$ctrl.changePosition(tile.index, i, rowToUpdate);
          break;
        }
      }

      this.lastX = this.x;
    };

    CxDraggable.prototype.onPress = function () {
      var tile = this.tile;

      this.lastX = this.x;
      tile.isDragging = true;
      tile.lastIndex = tile.index;

      TweenLite.to(this.$elem, 0.2, {
        autoAlpha: 0.75,
        boxShadow: '0 6px 10px 0 rgba(0, 0, 0, 0.3), 0 2px 2px 0 rgba(0, 0, 0, 0.2)',
        scale: 0.95,
        zIndex: '+=1000'
      });
    };

    CxDraggable.prototype.onRelease = function () {
      var tile = this.tile,
        zIndex = (this.$ctrl.getConfig('zIndex') || 0);

      zIndex += 1;

      // Move tile back to last position if released out of bounds
      if (this.hitTest(this.$ctrl.$container, 0)) {
        this.$ctrl.layoutInvalidated();
      } else {
        this.$ctrl.changePosition(tile.index, tile.lastIndex);
      }

      TweenLite.to(this.$elem, 0.2, {
        autoAlpha: 1,
        boxShadow: '0 1px 3px  0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.6)',
        scale: 1,
        x: tile.x,
        y: tile.y,
        zIndex: zIndex
      });

      this.$ctrl.setConfig('zIndex', zIndex);
      tile.isDragging = false;
    };

    return CxDraggable;
  }
])

.controller('cxSortableCtrl', [
  '$scope',
  '$window',
  'TimelineMax',
  'CxDraggable',
  function ($scope, $window, TimelineMax, CxDraggable) {
    'use strict';

    var self = this,
      _draggables = [],
      _config = {
        fixedSize: true, // When true, each tile's colspan will be fixed to 1
        oneColumn: false, // When true, grid will only have 1 column and tiles have fixed colspan of 1
        threshold: '50%', // This is amount of overlap between tiles needed to detect a collision,
        gutter: 7,
        colCount: null,
        rowCount: null,
        gutterStep: null,
        rowSize: 100,
        colSize: 100,
        zIndex: 1000,
      };

    this.$container = null;

    this.changePosition = function (from, to, rowToUpdate) {
      var insert = from > to ? 'insertBefore' : 'insertAfter',
        draggables = this.getDraggables(),
        newNode = draggables[from].$elem,
        referenceNode = draggables[to].$elem,
        parent = referenceNode.parentNode;

      // Change DOM positions
      if (from > to) {
        parent.insertBefore(parent.removeChild(newNode), referenceNode);
      } else {
        parent.insertBefore(parent.removeChild(newNode), referenceNode.nextSibling);
      }

      _draggables.splice(to, 0, _draggables.splice(from, 1)[0]);

      this.layoutInvalidated(rowToUpdate);
    };

    this.layoutInvalidated = function (rowToUpdate) {
      var timeline = new TimelineMax(),
        draggables = this.getDraggables(),
        partialLayout = (rowToUpdate > -1),
        colCount = this.getConfig('colCount'),
        rowCount = this.getConfig('rowCount'),
        colSize = this.getConfig('colSize'),
        rowSize = this.getConfig('rowSize'),
        gutterStep = this.getConfig('gutterStep'),
        zIndex = this.getConfig('zIndex'),
        height = 0,
        col = 0,
        row = 0,
        time = 0.35;

      angular.forEach(draggables, angular.bind(this, function (draggable, index) {
        var tile = draggable.tile,
          oldRow = tile.row,
          oldCol = tile.col,
          newTile = tile.newTile,
          from,
          to,
          duration;

        // PARTIAL LAYOUT: This condition can only occur while a tile is being
        // dragged. The purpose of this is to only swap positions within a row,
        // which will prevent a tile from jumping to another row if a space
        // is available. Without this, a large tile in column 0 may appear
        // to be stuck if hit by a smaller tile, and if there is space in the
        // row above for the smaller tile. When the user stops dragging the
        // tile, a full layout update will happen, allowing tiles to move to
        // available spaces in rows above them.
        if (partialLayout) {
          row = tile.row;
          if (tile.row !== rowToUpdate) {
            return;
          }
        }

        // Update trackers when colCount is exceeded
        if (col + tile.colspan > colCount) {
          col = 0;
          row += 1;
        }

        angular.extend(tile, {
          col: col,
          row: row,
          index: index,
          x: col * gutterStep + (col * colSize),
          y: row * gutterStep + (row * rowSize),
          width: tile.colspan * colSize + ((tile.colspan - 1) * gutterStep),
          height: tile.rowspan * rowSize
        });

        col += tile.colspan;

        // If the tile being dragged is in bounds, set a new
        // last index in case it goes out of bounds
        if (tile.isDragging && tile.inBounds) {
          tile.lastIndex = index;
        }

        if (newTile) {
          // Clear the new tile flag
          tile.newTile = false;

          from = {
            autoAlpha: 0,
            boxShadow: '0 1px 3px  0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.6)',
            height: tile.height,
            scale: 0,
            width: tile.width
          };

          to = {
            autoAlpha: 1,
            scale: 1,
            zIndex: zIndex
          };

          timeline.fromTo(draggable.$elem, time, from, to, 'reflow');
        }

        // Don't animate the tile that is being dragged and
        // only animate the tiles that have changes
        if (!tile.isDragging && (oldRow !== tile.row || oldCol !== tile.col)) {
          duration = newTile ? 0 : time;

          // Boost the z-index for tiles that will travel over
          // another tile due to a row change
          if (oldRow !== tile.row) {
            zIndex += 1;
            timeline.set(draggable.$elem, {
              zIndex: zIndex
            }, 'reflow');

            this.setConfig('zIndex', zIndex);
          }

          timeline.to(draggable.$elem, duration, {
            x: tile.x,
            y: tile.y,
            onComplete: function () {
              tile.positioned = true;
            },
            onStart: function () {
              tile.positioned = false;
            }
          }, 'reflow');
        }

        draggable.tile = tile;
      }));

      // If the row count has changed, change the height of the container
      if (row !== rowCount) {
        rowCount = row;
        height = rowCount * gutterStep + (++row * rowSize);
        timeline.to(this.$container, 0.2, {
          height: height
        }, 'reflow');
      }
    };

    this.getConfig = function (key) {
      return _config.hasOwnProperty(key) ? _config[key] : undefined;
    };

    this.setConfig = function (key, value) {
      _config[key] = value;

      return this.getConfig(key);
    };

    this.getDraggables = function () {
      return _draggables;
    };

    this.createTile = function ($elem) {
      _draggables.push(new CxDraggable($elem, this));
      this.layoutInvalidated();
    };

    this.resize = function () {
      var outerWidth = this.$container.getBoundingClientRect().width;

      _config.colCount = _config.oneColumn ? 1 : Math.floor(outerWidth / (_config.colSize + _config.gutter));
      _config.gutterStep = _config.colCount == 1 ? _config.gutter : (_config.gutter * (_config.colCount - 1) / _config.colCount);
      _config.rowCount = 0;

      this.layoutInvalidated();
    };

    angular.element($window).on('resize', angular.bind(this, this.resize));
  }
])

.directive('cxSortables', [
  'TweenLite',
  function (TweenLite) {
    'use strict';

    return {
      controller: 'cxSortableCtrl',
      restrict: 'AE',
      link: function ($scope, $elem, $attr, $ctrl) {
        var startWidth = '100%';

        $ctrl.$container = $elem[0];

        TweenLite.to($elem, 0.2, {
          width: startWidth
        });

        TweenLite.delayedCall(0.25, angular.bind($ctrl, $ctrl.resize));
      }
    };
  }
])

.directive('cxSortable', [
  function () {
    'use strict';

    return {
      require: '^cxSortables',
      restrict: 'AE',
      link: function ($scope, $elem, $attr, $ctrl) {

        $ctrl.createTile($elem[0]);
      }
    };
  }
]);
