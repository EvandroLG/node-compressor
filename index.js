#! /usr/bin/env node


/*
  * node-compressor: a complete solution to compress static files with node
  * http://github.com/EvandroLG/node-compressor
  * author: Evandro Leopoldino Goncalves <evandrolgoncalves@gmail.com>
  * http://github.com/evandrolg
  * License: MIT
*/


'strict mode';


var fs = require('fs');
var path = require('path');
var Params = require('./lib/params');
var Compressor = require('./lib/compressor');


var main = function(file) {
  fs.readFile(file, 'utf8', function(err, data) {
    var root = Params.root || path.dirname(file);
    new Compressor(err, data, root + '/', file); 
  });
};

var files = Params.read().files;
files.forEach(main);
