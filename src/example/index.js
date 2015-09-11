angular.module('example.app', [
  'ng.cx.sortable'
])

.controller('ExampleCtrl', [
  '$scope',
  function ($scope) {
    'use strict';

    $scope.things = 'Pneumonoultramicroscopicsilicovolcanoconiosis'.split('');
  }
]);
