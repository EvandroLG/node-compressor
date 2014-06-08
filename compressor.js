#! /usr/bin/env node

/*
  * node-compressor: a complete solution to compress static files with node
  * http://github.com/EvandroLG/node-compressor
  * author: Evandro Leopoldino Goncalves <evandrolgoncalves@gmail.com>
  * http://github.com/evandrolg
  * License: MIT
*/

var fs = require('fs-extra');
var rimraf = require('rimraf');
var uglify = require('uglify-js');
var ClearCss = require('clean-css');
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

var Compressor = function(err, data, root) {
  this.root = root;
  this.srcScripts = [];
  var content = data.split('\n');
  var i = 0;
  var size = content.length;

  for (; i < size; i++) {
    var line = content[i];
    var hasCompressJs = line.indexOf('compress js') !== -1;
    var hasCompressCss = line.indexOf('compress css') !== -1;

    if (hasCompressJs) this.saveFilesJs(content, i+1);
    if (hasCompressCss) this.saveFilesCss(content, i+1);
  }

  this.copyPage();
};

Compressor.prototype = {
  copyPage: function() {
    var file = params.file;
    var pathfile = this.root + '.compressed/' + path.basename(file);

    fs.copySync(file, pathfile);
    this.updateScripts(pathfile);
  },

  updateScripts: function(filename) {
    var that = this;

    fs.readFile(filename, 'utf8', function(err, data) {
      that.srcScripts.forEach(function(value) {
        var script = '<script type="text/script" src=js/{{ SRC }}></script>';
        script = script.replace('{{ SRC }}', value);

        // remove blank lines
        var code = data.replace(/(\r\n|\n|\r)/gm, '');
        // replace scripts for optimized script
        code = code.replace(/<!\-\- compress js \-\->(.*)<!\-\- endcompress \-\->/,
                           script);

        fs.writeFile(filename, code);
      });
    });
  },

  createDirectories: function(callback) {
    if (this.hasDirectory) {
      callback();
      return;
    }

    rimraf.sync(this.root + '.compressed');
    fs.mkdirSync(this.root + '.compressed/');
    fs.mkdirSync(this.root + '.compressed/js');

    this.hasDirectory = true;

    callback();
  },

  createMinifyJs: function(scripts) {
    var code = uglify.minify(scripts).code;
    var filename = guid() + '.js';
    this.srcScripts.push(filename);
    var srcScript = this.root + '.compressed/js/' + filename;
    
    this.createDirectories(function() {
      fs.writeFile(srcScript, code);
    });
  },

  createMinifyCss: function(styles) {
    var root = this.root;

    styles.forEach(function(src, index) {
      var srcStyle = root + src;
      var source = '';

      fs.readFile(srcStyle, 'utf-8', function(err, data) {
        source += data;
        var minimized = new ClearCss().minify(source);
        console.log(minimized);
      });
    });
  },

  extractSource: function(line) {
    var re = /(\bsrc\b|\bhref\b)=[\'|\"](.*)[\'|\"]/;
    var src = line.match(re)[2];

    return src;
  },

  saveFiles: function(content, i) {
    var files = [];
    var size = content.length;

    for (; i < size; i++) {
      var line = content[i];
      var isEndCompress = line.indexOf('endcompress') !== -1;

      if (isEndCompress) {
        break;
      }

      var src = this.extractSource(line);

      files.push(src);
    }

    return files;
  },

  saveFilesJs: function(content, i) {
    var scripts = this.saveFiles(content, i);
    this.createMinifyJs(scripts);
  },

  saveFilesCss: function(content, i) {
    var styles = this.saveFiles(content, i);
    this.createMinifyCss(styles);
  }
};

var Params = function() {
  this.args = process.argv.slice(2);
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
      var isRoot = key === '-r' || key === '--root';

      if(isFile) {
        that.file = value;
      }

      if(isRoot) {
        that.root = value;
      }

    });
  }
};

var params = new Params();

var main = function(err, data) {
  var root = params.root || '';
  new Compressor(err, data, root);
};

fs.readFile(params.file, 'utf8', main);
