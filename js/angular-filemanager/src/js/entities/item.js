(function(window, angular, $) {
    "use strict";
    angular.module('FileManagerApp').factory('item', ['$http', '$q', '$translate', 'fileManagerConfig', 'chmod', 'API_KEY', 'SESSION_TOKEN', function($http, $q, $translate, fileManagerConfig, Chmod, API_KEY, SESSION_TOKEN) {

        var Item = function(model, path) {

            var rawModel = {
                name: model && model.name || '',
                path: path || [],
                type: model && model.type || 'file',
                size: model && parseInt(model.size || 0),
                date: model && model.date,
                perms: new Chmod(model && model.rights),
                content: model && model.content || '',
                content_type: model && model.content_type,
                recursive: false,
                sizeKb: function() {
                    return Math.round(this.size / 1024, 1);
                },
                fullPath: function() {
                    return ('/' + this.path.join('/') + '/' + this.name).replace(/\/\//, '/');
                }
            };

            this.error = '';
            this.inprocess = false;

            if(rawModel.type === 'file' && rawModel.content_type && rawModel.content_type.indexOf("image/") > -1) {
                this.imagePath = fileManagerConfig.baseUrl + (rawModel.path.join('/') + '/' + rawModel.name).replace(/\/\//, '/') + '?api_key=' + API_KEY + '&session_token=' + SESSION_TOKEN;
            }

            this.model = angular.copy(rawModel);
            this.tempModel = angular.copy(rawModel);
            function getMonthFromString(mon){
               return new Date(Date.parse(mon +" 1, 2012")).getMonth()+1
            }
        };

        Item.prototype.update = function() {
            angular.extend(this.model, angular.copy(this.tempModel));
        };

        Item.prototype.revert = function() {
            angular.extend(this.tempModel, angular.copy(this.model));
            this.error = '';
        };

        Item.prototype.deferredHandler = function(data, deferred, defaultMsg) {
            if (!data || typeof data !== 'object') {
                this.error = 'Bridge response error, please check the docs';
            }
            if (data.result && data.result.error) {
                this.error = data.result.error;
            }
            if (!this.error && data.error) {
                this.error = data.error.message;
            }
            if (!this.error && defaultMsg) {
                this.error = defaultMsg;
            }
            if (this.error) {
                return deferred.reject(data);
            }
            this.update();
            return deferred.resolve(data);
        };

        Item.prototype.createFolder = function() {
            var self = this;

            var deferred = $q.defer();
            var data = {params: {
                mode: "addfolder",
                path: self.tempModel.path.join('/'),
                name: self.tempModel.name
            }};

            self.inprocess = true;
            self.error = '';

            var req = {
                method: 'POST',
                url: fileManagerConfig.baseUrl + self.tempModel.path.join('/') + '/',
                headers: {
                    'X-Folder-Name': self.tempModel.name
                }
            }

            $http(req).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_creating_folder'));
            })['finally'](function(data) {
                self.inprocess = false;
            });

            return deferred.promise;
        };

        Item.prototype.rename = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                "mode": "rename",
                "path": self.model.fullPath(),
                "newPath": self.tempModel.fullPath()
            }};
            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.renameUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_renaming'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.copy = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "copy",
                path: self.model.fullPath(),
                newPath: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.copyUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_copying'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.compress = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "compress",
                path: self.model.fullPath(),
                destination: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.compressUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_compressing'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.extract = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "extract",
                path: self.model.fullPath(),
                sourceFile: self.model.fullPath(),
                destination: self.tempModel.fullPath()
            }};

            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.extractUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_extracting'));
            })["finally"](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.download = function(preview) {

            var self = this;
            var data = {
                mode: "download",
                preview: preview,
                path: self.model.fullPath()
            };

            var base = fileManagerConfig.baseUrl.endsWith("/") ? fileManagerConfig.baseUrl.substring(0, fileManagerConfig.baseUrl.length - 1) : fileManagerConfig.baseUrl;


            if (self.model.type === 'folder') {
                var url = base + self.model.fullPath() + '/?api_key=' + API_KEY + '&session_token=' + SESSION_TOKEN + '&zip=true';
                window.open(url, '_blank', '');
            } else {
                var target = $(this).data('path');
                var url = base + self.model.fullPath() + '?api_key=' + API_KEY + '&session_token=' + SESSION_TOKEN + '&download=true';

                window.open(url, '_blank', '');
            }
        };

        Item.prototype.preview = function() {

            var self = this;
            return self.download(true);
        };

        Item.prototype.getContent = function() {


            var self = this;

            self.error = '';

            var mime = self.tempModel.content_type;

            var url = self.model.fullPath() + '?method=GET';

            var w = window.open('editor.html?path=' + url + '&mime=' + mime + '&api_key=' + apiKey + '&session_token=' + sessionToken,
                url + " " + mime,
                'width=800,height=400,toolbars=no,statusbar=no,resizable=no'
            );
            w.focus();

            return false;
        };

        Item.prototype.remove = function() {

            var self = this;
            var deferred = $q.defer();

            var data = {"resource":[{"path": self.tempModel.name, "type": self.tempModel}]};

            var base = fileManagerConfig.baseUrl.endsWith("/") ? fileManagerConfig.baseUrl.substring(0, fileManagerConfig.baseUrl.length - 1) : fileManagerConfig.baseUrl;

            var url = self.tempModel.type === 'folder' ? base + self.tempModel.fullPath() + '/?force=true' :  base + self.tempModel.fullPath() + '?force=true';

            var req = {
                method: 'POST',
                url: url,
                headers: {
                    'X-HTTP-Method': 'DELETE'
                }
            }

            self.inprocess = true;
            self.error = '';
            $http(req, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_deleting'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.edit = function() {

            var self = this;
            var deferred = $q.defer();

            var url = fileManagerConfig.baseUrl + self.model.fullPath();

            self.inprocess = true;
            self.error = '';

            $http.put(url, self.tempModel.content).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_modifying'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.changePermissions = function() {
            var self = this;
            var deferred = $q.defer();
            var data = {params: {
                mode: "changepermissions",
                path: self.tempModel.fullPath(),
                perms: self.tempModel.perms.toOctal(),
                permsCode: self.tempModel.perms.toCode(),
                recursive: self.tempModel.recursive
            }};

            self.inprocess = true;
            self.error = '';
            $http.post(fileManagerConfig.permissionsUrl, data).success(function(data) {
                self.deferredHandler(data, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, $translate.instant('error_changing_perms'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        Item.prototype.isFolder = function() {
            return this.model.type === 'folder';
        };

        Item.prototype.isEditable = function() {
            return !this.isFolder() && fileManagerConfig.isEditableFilePattern.test(this.model.name);
        };

        Item.prototype.isImage = function() {
            return fileManagerConfig.isImageFilePattern.test(this.model.name);
        };

        Item.prototype.isCompressible = function() {
            return this.isFolder();
        };

        Item.prototype.isExtractable = function() {
            return !this.isFolder() && fileManagerConfig.isExtractableFilePattern.test(this.model.name);
        };

        return Item;
    }]);
})(window, angular, jQuery);
