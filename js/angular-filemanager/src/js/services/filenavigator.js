(function(angular) {
    "use strict";
    angular.module('FileManagerApp').service('fileNavigator', [
        '$http', '$q', 'fileManagerConfig', 'item', function ($http, $q, fileManagerConfig, Item) {

        $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        var FileNavigator = function() {
            this.requesting = false;
            this.fileList = [];
            this.currentPath = [];
            this.history = [];
            this.error = '';
        };

        FileNavigator.prototype.deferredHandler = function(data, deferred, defaultMsg) {
            if (!data || typeof data !== 'object') {
                this.error = 'Bridge response error, please check the docs';
            }
            if (!this.error && data.result && data.result.error) {
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
            return deferred.resolve(data);
        };

        FileNavigator.prototype.list = function() {
            var self = this;
            var deferred = $q.defer();
            var path = self.currentPath.join('/');

            self.requesting = true;
            self.fileList = [];
            self.error = '';

            var url = '';
            if(!path) {
                url = fileManagerConfig.listUrl;
                self.rootLevel = true;
            } else {
                url = fileManagerConfig.baseUrl + path;
                self.rootLevel = false;
            }

            if(!url.endsWith('/')) url = url + '/';

            $http.get(url).success(function(data) {
                var returnValue = {}, date, type, size, content_type;
                returnValue.result = [];
                // this is hacky but needed for /api/v2 to work for services
                var items = path ? data.resource : data.services;
                if (!path) {
                    // name only
                    items = items.map(function(item) {
                        return {"name": item.name};
                    });
                }
                angular.copy(items).forEach(function(item) {
                    date = item.last_modified || new Date();
                    type = item.type || "folder";
                    size = item.content_length || "";
                    content_type= item.content_type;
                    returnValue.result.push({
                        'name': item.name ? item.name : item,
                        'date': date,
                        'type': type,
                        'size': size,
                        'content_type': content_type
                    });
                });

                self.deferredHandler(returnValue, deferred);
            }).error(function(data) {
                self.deferredHandler(data, deferred, 'Unknown error listing, check the response');
            })['finally'](function(data) {
                self.requesting = false;
            });
            return deferred.promise;
        };

        FileNavigator.prototype.refresh = function() {
            var self = this;
            var path = self.currentPath.join('/');

            return self.list().then(function(data) {
                self.fileList = (data.result || []).map(function(file) {
                    return new Item(file, self.currentPath);
                })
                self.buildTree(path);
            });
        };

        FileNavigator.prototype.buildTree = function(path) {
            var self = this;
            function recursive(parent, item, path) {
                var absName = path ? (path + '/' + item.model.name) : item.model.name;
                if (parent.name.trim() && path.trim().indexOf(parent.name) !== 0) {
                    parent.nodes = [];
                }
                if (parent.name !== path) {
                    for (var i in parent.nodes) {
                        recursive(parent.nodes[i], item, path);
                    }
                } else {
                    for (var e in parent.nodes) {
                        if (parent.nodes[e].name === absName) {
                            return;
                        }
                    }
                    parent.nodes.push({item: item, name: absName, nodes: []});
                }
                parent.nodes = parent.nodes.sort(function(a, b) {
                    return a.name < b.name ? -1 : a.name === b.name ? 0 : 1;
                });
            };

            !self.history.length && self.history.push({name: path, nodes: []});
            for (var o in self.fileList) {
                var item = self.fileList[o];

                if(typeof(item) === Object) {
                    item.isFolder() && recursive(self.history[0], item, path);
                }
            }
        };

        FileNavigator.prototype.folderClick = function(item) {

            var self = this;
            self.currentPath = [];
            if (item && item.isFolder()) {
                self.currentPath = item.model.fullPath().split('/').splice(1);
            }

            self.refresh();

        };

        FileNavigator.prototype.upDir = function() {
            var self = this;
            if (self.currentPath[0]) {
                self.currentPath = self.currentPath.slice(0, -1);
                self.refresh();
            }
        };

        FileNavigator.prototype.goTo = function(index) {
            var self = this;
            self.currentPath = self.currentPath.slice(0, index + 1);
            self.refresh();
        };

        FileNavigator.prototype.fileNameExists = function(fileName) {
            var self = this;
            for (var item in self.fileList) {
                item = self.fileList[item];
                if (fileName.trim && item.model.name.trim() === fileName.trim()) {
                    return true;
                }
            }
        };

        FileNavigator.prototype.listHasFolders = function() {
            var self = this;
            for (var item in self.fileList) {
                if (self.fileList[item].model !== undefined) {
                    if (self.fileList[item].model.type === 'dir') {
                        return true;
                    }
                }
            }
        };

        return FileNavigator;
    }]);
})(angular);
