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
      var self = this,
        tile = {
          col: null,
          height: 0,
          inBounds: true,
          index: null,
          isDragging: false,
          lastIndex: null,
          newTile: true,
          positioned: false,
          row: null,
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

      Object.defineProperty(this.$elem, '$draggable', {
        get: function () {
          return self;
        }
      });
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
        testTile = tiles[i].$draggable.tile;
        onSameRow = (tile.row === testTile.row);
        rowToUpdate = onSameRow ? tile.row : -1;
        shiftLeft = onSameRow ? (this.x < this.lastX && tile.index > i) : true;
        shiftRight = onSameRow ? (this.x > this.lastX && tile.index < i) : true;
        validMove = (testTile.positioned && (shiftLeft || shiftRight));

        if (this.hitTest(tiles[i], this.$ctrl.getConfig('threshold')) && validMove) {
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
      _config = {
        threshold: '50%', // This is amount of overlap between tiles needed to detect a collision,
        rowCount: null,
        gutterStep: 0,
        zIndex: 1000,
      },
      _onChangePositionCallback;

    this.$container = null;

    this.changePosition = function (from, to, rowToUpdate) {
      var insert = from > to ? 'insertBefore' : 'insertAfter',
        draggables = this.getDraggables(),
        newNode = draggables[from],
        referenceNode = draggables[to],
        parent = referenceNode.parentNode;

      // Change DOM positions
      if (from > to) {
        parent.insertBefore(parent.removeChild(newNode), referenceNode);
      } else {
        parent.insertBefore(parent.removeChild(newNode), referenceNode.nextSibling);
      }

      this.layoutInvalidated(rowToUpdate);

      if (_onChangePositionCallback) {
        _onChangePositionCallback();
      }
    };

    this.layoutInvalidated = function (rowToUpdate) {
      var timeline = new TimelineMax(),
        draggables = this.getDraggables(),
        partialLayout = (rowToUpdate > -1),
        rowCount = this.getConfig('rowCount'),
        gutterStep = this.getConfig('gutterStep'),
        zIndex = this.getConfig('zIndex'),
        height = 0,
        col = 0,
        row = 0,
        time = 0.35;

      var containerWidth = this.$container.getBoundingClientRect().width,
        colWidth = 0,
        colHeight = 0,
        rowOffset = 0;

      angular.forEach(draggables, angular.bind(this, function (elem, index) {
        var draggable = elem.$draggable,
          tile = draggable.tile,
          rect = draggable.$elem.getBoundingClientRect(),
          rectWidth = Math.round(rect.width),
          rectHeight = Math.round(rect.height),
          oldRow = tile.row,
          oldCol = tile.col,
          from,
          to,
          duration;

        colHeight = rectHeight > colHeight ? rectHeight : colHeight;

        if ((colWidth + rectWidth) > containerWidth) {
          colWidth = 0;
          rowOffset += colHeight + gutterStep;

          // @TODO: Do we really need col.
          col = 0;
          row += 1;
        }

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
            colWidth += rectWidth + gutterStep;
            return;
          }
        }

        angular.extend(tile, {
          col: col,
          row: row,
          index: index,
          x: colWidth,
          y: rowOffset,
          width: rectWidth,
          height: rectHeight
        });

        colWidth += rectWidth + gutterStep;
        col += 1;

        // If the tile being dragged is in bounds, set a new
        // last index in case it goes out of bounds
        if (tile.isDragging && tile.inBounds) {
          tile.lastIndex = index;
        }

        if (tile.newTile) {
          // Clear the new tile flag
          tile.newTile = false;

          from = {
            autoAlpha: 0,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.6)',
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
          duration = tile.newTile ? 0 : time;

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
        timeline.to(this.$container, 0.2, {
          height: rowOffset + colHeight + gutterStep
        }, 'reflow');

        this.setConfig('rowCount', rowCount);
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
      return this.$container.querySelectorAll('.tile');
    };

    this.createTile = function ($elem) {
      return new CxDraggable($elem, this);
    };

    this.onChangedPosition = function (callback) {
      _onChangePositionCallback = callback;
    };

    this.resize = function () {
      _config.rowCount = 0;

      this.layoutInvalidated();
    };

    angular.element($window).on('resize', angular.bind(this, this.resize));
  }
])

.directive('cxSortablesList', [
  '$compile',
  '$rootScope',
  'TweenLite',
  function ($compile, $rootScope, TweenLite) {
    'use strict';

    return {
      controller: 'cxSortableCtrl',
      restrict: 'AE',
      scope: {
        'items': '=ioSortablesList'
      },
      link: function ($scope, $elem, $attr, $ctrl) {
        var startWidth = $attr.ioSortablesListWidth || $elem[0].getBoundingClientRect().width,
          template = '<div class="tile" cx-sortable-list-item>' + $elem.html() + '</div>',
          childScope,
          childNode,
          i;

        for (i = 0; i < $scope.items.length; i++) {
          childNode = angular.element(template);
          childScope = $rootScope.$new(true, $scope);
          childScope[$attr.ioSortablesListItemAs] = $scope.items[i];

          $elem.append(childNode);
          $compile(childNode)(childScope);
        }

        $ctrl.$container = $elem[0];
        $ctrl.setConfig('gutterStep', parseInt($attr.ioSortablesListGutter || 0, 10));

        $ctrl.onChangedPosition(function () {
          var draggables = $ctrl.getDraggables(),
            model = [];

          for (var i = 0; i < draggables.length; i++) {
            model.push(angular.element(draggables[i]).scope()[$attr.ioSortablesListItemAs]);
          }

          $scope.$evalAsync(function () {
            $scope.items = model;
          });
        });

        TweenLite.to($elem, 0.2, {
          width: startWidth
        });

        TweenLite.delayedCall(0.2, angular.bind($ctrl, $ctrl.resize));
      }
    };
  }
])

.directive('cxSortableListItem', [
  function () {
    'use strict';
    return {
      require: '^cxSortablesList',
      restrict: 'AE',
      link: function ($scope, $elem, $attr, $ctrl) {

        $scope.$draggable = $ctrl.createTile($elem[0]);
      }
    };
  }
]);
