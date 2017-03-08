(function(angular) {
    "use strict";
    var app = angular.module('FileManagerApp');

    app.filter('strLimit', ['$filter', function($filter) {
        return function(input, limit) {
            if (input.length <= limit) {
                return input;
            }
            return $filter('limitTo')(input, limit) + '...';
        };
    }]);

    app.filter('formatDate', ['$filter', function($filter) {
        return function(input, limit) {

            var ret = false;

            try {
                var d = new Date(input);

                ret = d.getFullYear() + '-'
                        + ('0' + (d.getMonth() + 1)).slice(-2) + '-'
                        + ('0' + d.getDate()).slice(-2) + ' '
                        + ('0' + d.getHours()).slice(-2) + ':'
                        + ('0' + d.getMinutes()).slice(-2) + ':'
                        + ('0' + d.getSeconds()).slice(-2);
            } catch(e) {
                ret = input.toString();
            }

            return ret;
        };
    }]);
})(angular);
