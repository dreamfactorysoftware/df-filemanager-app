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
            if(input instanceof Date) {
                try {
                    ret = input.toISOString().substring(0, 19).replace('T', ' ');

                } catch(e) {
                    ret = (input.toLocaleString || input.toString).apply(input);
                }
            }
            return ret;

        };
    }]);
})(angular);
