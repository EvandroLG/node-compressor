#! /usr/bin/env node


var fs = require('fs-extra');
var rimraf = require('rimraf');
var uglify = require('uglify-js');
var path = require('path');


/*
  function that create a guid - global unique identifier
  http://note19.com/2007/05/27/javascript-guid-generator/
*/
var guid = function() {
  var s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16).substring(1);
  };

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
};


var Compressor = function(err, data) {
  this.srcScripts = [];
  var content = data.split('\n');
  var i = 0;
  var size = content.length;

  for (; i < size; i++) {
    var line = content[i];
    var isCompress = line.indexOf('compress js') !== -1;

    if (isCompress) {
      this.saveFiles(content, i+1);
    }
  }

  this.copyPage();
};

Compressor.prototype = {
  copyPage: function() {
    var file = params.file;
    var newFile = '.compressed/' + path.basename(file);

    fs.copySync(file, newFile);
  },

  createDirectories: function(callback) {
    if (this.hasDirectory) {
      callback();
      return;
    }

    rimraf.sync('.compressed');
    fs.mkdirSync('.compressed/');
    fs.mkdirSync('.compressed/js');

    this.hasDirectory = true;

    callback();
  },

  createMinify: function(scripts) {
    var code = uglify.minify(scripts).code;
    var filename = guid() + '.js';
    this.srcScripts.push(filename);
    var srcScript = '.compressed/js/' + filename;

    this.createDirectories(function() {
      fs.writeFile(srcScript, code);
    });
  },

  extractSource: function(line) {
    var re = /src=[\'|\"](.*)[\'|\"]/;
    var src = line.match(re)[1];

    return 'app/' + src;
  },

  saveFiles: function(content, i) {
    var scripts = [];
    var size = content.length;

    for (; i < size; i++) {
      var line = content[i];
      var isEndCompress = line.indexOf('endcompress') !== -1;

      if (isEndCompress) {
        break;
      }

      var src = this.extractSource(line);
      scripts.push(src);
    }

    this.createMinify(scripts);
  }
};


var Params = function() {
  this.args = process.argv.slice(2);
  this.file = undefined;

  this.read();
};

Params.prototype = {
  read: function() {
    var that = this;

    this.args.forEach(function(param) {
      var splited = param.split('=');
      var key = splited[0];
      var value = splited[1];
      var isFile = key === '-f' || key === '--file';

      if(isFile) {
        that.file = value;
      }
    });
  }
};


var params = new Params();


var main = function(err, data) {
  new Compressor(err, data);
};


fs.readFile(params.file, 'utf8', main);
