
angular.module('example.app', [
    'ng.cx.sortable'
])

.controller('ExampleCtrl', [
    '$scope',
    function ($scope) {
        $scope.things = 'Pneumonoultramicroscopicsilicovolcanoconiosis'.split('');
    }
]);