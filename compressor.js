#! /usr/bin/env node

/*
  * node-compressor: a complete solution to compress static files with node
  * http://github.com/EvandroLG/node-compressor
  * author: Evandro Leopoldino Goncalves <evandrolgoncalves@gmail.com>
  * http://github.com/evandrolg
  * License: MIT
*/

var fs = require('fs');
var Params = require('./lib/params');
var Compressor = require('./lib/compressor');


var params = new Params();

var main = function(err, data) {
  var root = params.root || '';
  new Compressor(err, data, root, params);
};

fs.readFile(params.file, 'utf8', main);
