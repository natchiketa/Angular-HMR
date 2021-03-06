var path = require('path');
var SourceNode = require('source-map').SourceNode;
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var makeIdentitySourceMap = require('./makeIdentitySourceMap');

var angularModule= /[_]?angular[0-9]?[\.\n ]+(?:default[\.\n ]+)?module\(([\'\"\w\.\/\(\)\n\-\,\[\] ]+)\)/g;

module.exports = function (source, map) {
  if (this.cacheable) {
    this.cacheable();
  }

  if (!source.match(angularModule)) {
    // console.log(`[AHMR] Did not match: ${map.sources.join(', ')}`);
    return this.callback(null, source, map);
  }

  // console.log(`[AHMR] Replacement Matched: ${map.sources.join(', ')}`);

  var separator = '\n\n';
  var prependText;
  var processedSource;
  var node;
  var result;

  var ahrPath = path.resolve('./angular-hot-replacement.js');
  this.addDependency(ahrPath);

  prependText = [
    'module.hot.accept();',
    'var hotAngular = require(' + JSON.stringify(require.resolve('./angular-hot-replacement')) + ');'
  ].join(' ');

  var appendText = [
    //'module.hot.dispose(function(data) {console.log(\'[SBOS] Reloaded\')})'
  ].join(' ');

  processedSource = source.replace(angularModule, 'hotAngular.test(module).module($1)');

  if (this.sourceMap === false) {
    return this.callback(null, [
      prependText,
      processedSource,
      appendText
    ].join(separator));
  }

  if (!map) {
    map = makeIdentitySourceMap(source, this.resourcePath);
  }

  node = new SourceNode(null, null, null, [
    new SourceNode(null, null, this.resourcePath, prependText),
    SourceNode.fromStringWithSourceMap(processedSource, new SourceMapConsumer(map))
  ]).join(separator);

  result = node.toStringWithSourceMap();

  this.callback(null, result.code, result.map.toString());
};
