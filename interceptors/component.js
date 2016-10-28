module.exports = function(name, d) {
  var obj = null;

  if(Array.isArray(d)) {
    obj = d[d.length - 1]();
  }
  else if(typeof d === 'function') {
    obj = d();
  }
  else if(typeof d === 'object') {
    obj = d;
  }
  else {
    throw new Error('Malformed component function');
  }

  var exists = this.MODULE_CACHE[name];
  var _that = this;

  var transform = function(n, obj) {
    if(obj.template) {
      obj.template = function() {
        return _that.templateCache[n];
      };
    }

    if (obj.controller && typeof obj.controller === 'function') {
      obj.controller = function($injector, $scope) {
        return $injector.invoke(_that.controllerCache[n], this, {
          '$scope': $scope
        });
      };
    }

    return obj;
  };

  console.log('COMPONENT', name, obj);

  var changes = false;

  changes = changes || JSON.stringify(obj.template) != JSON.stringify(this.templateCache[name]);

  if(obj.template) {
    this.templateCache[name] = obj.template;
  }

  changes = changes || obj.controller + '' != this.controllerCache[name] + '';

  if(obj.controller) {
    this.controllerCache[name] = obj.controller;
  }

  if(changes && exists) {
    this.reloadState();
  }

  if(!exists) {
    this.ANGULAR_MODULE.component(name, transform(name, obj));

    this.MODULE_CACHE[name] = true;
  }

  return this;
};
