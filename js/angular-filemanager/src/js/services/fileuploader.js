(function(window, angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileUploader', ['$http', '$q', 'fileManagerConfig', 'API_KEY', 'SESSION_TOKEN', function ($http, $q, fileManagerConfig, API_KEY, SESSION_TOKEN) {

        function deferredHandler(data, deferred, errorMessage) {
            if (!data || typeof data !== 'object') {
                return deferred.reject('Bridge response error, please check the docs');
            }
            if (data.result && data.result.error) {
                return deferred.reject(data);
            }
            if (data.error) {
                return deferred.reject(data);
            }
            if (errorMessage) {
                return deferred.reject(errorMessage);
            }
            deferred.resolve(data);
        }

        this.requesting = false;
        this.upload = function(fileList, path) {
            if (! window.FormData) {
                throw new Error('Unsupported browser version');
            }
            var self = this;
            var form = new window.FormData();
            var deferred = $q.defer();
            path = path.join('/');
            if(!path.endsWith('/')) path = path + '/?api_key=' + API_KEY + '&session_token=' + SESSION_TOKEN;

            //form.append('destination', '/' + path);

            for (var i = 0; i < fileList.length; i++) {
                var fileObj = fileList.item(i);
                fileObj instanceof window.File && form.append('files', fileObj);
            }

            self.requesting = true;
            $http.post(fileManagerConfig.baseUrl + path, form, {
                transformRequest: angular.identity,
                headers: {
                    "Content-Type": undefined
                }
            }).success(function(data) {
                deferredHandler(data, deferred);
            }).error(function(data) {
                deferredHandler(data, deferred, 'Unknown error uploading files');
            })['finally'](function(data) {
                self.requesting = false;
            });;

            return deferred.promise;
        };
    }]);
})(window, angular);
