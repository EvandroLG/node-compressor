'use strict';


var fs = require('fs-extra');
var rimraf = require('rimraf');
var path = require('path');
var colors = require('colors');
var uglify = require('uglify-js');
var uglifycss = require('uglifycss');
var htmlMinifier = require('html-minifier');
var md5 = require('MD5');
var _ = require('underscore');


var Cached = {
  hasDirectory: false,
  compressedSnapshot: {}
};


var Compressor = function(err, data, root, file) {
  this.cacheVariables(root, file);

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

  // this.removeCacheFiles();
  this.copyPage();
};

Compressor.prototype = {
  cacheVariables: function(root, file) {
    this.file = file;
    this.root = root;
    this.dirname = path.dirname(path.resolve(file));
    this.srcScripts = [];
    this.srcStyles = [];
    this.compressedSnapshot = {
      css: [],
      js: []
    };
  },

  copyPage: function() {
    var pathfile = path.join(this.root, '.compressed', path.basename(this.file));

    fs.copySync(this.file, pathfile);
    this.updatePage(pathfile);
  },

  minifyHTML: function(code) {
    var minifiedCode = htmlMinifier.minify(code, {
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
      minifyCSS: true
    });

    return minifiedCode;
  },

  updatePage: function(filename) {
    fs.readFile(filename, 'utf8', function(err, data) {
      var code = this.updateFiles('css', filename, data);
      code = this.updateFiles('js', filename, code);
      code = this.minifyHTML(code);

      fs.writeFile(filename, code);
      console.log('Created new static files inside of the '.yellow +
                  '.compressed'.green + ' folder'.yellow);
    }.bind(this));
  },

  setTypeFiles: function() {
    var typeFiles = {
      js: {
        file: '<script src="{{ SRC }}"></script>',
        regex: /<!\-\- compress js \-\->(.*?)<!\-\- endcompress \-\->/,
        list: this.srcScripts
      },

      css: {
        file: '<link rel="stylesheet" type="text/css" href="{{ SRC }}">',
        regex: /<!\-\- compress css \-\->(.*?)<!\-\- endcompress \-\->/,
        list: this.srcStyles
      }
    };

    return typeFiles;
  },

  updateFiles: function(type, filename, data) {
    var typeFiles = this.setTypeFiles()[type];

    var list = typeFiles.list;
    var value = list[0];
    var file = typeFiles.file.replace('{{ SRC }}', value);
    // removes blank lines
    var code = data.replace(/(\r\n|\n|\r)/gm, '');
    // replaces scripts to optimized script
    code = code.replace(typeFiles.regex, file);
    // removes first script of the list
    list.shift();

    var hasCompressJS = list.length;
    if (hasCompressJS) return this.updateFiles(type, filename, code);

    return code;
  },

  createDirectories: function(callback) {
    var basedir = path.join(this.root, '.compressed');
    var cssdir = path.join(basedir, 'css');
    var jsdir = path.join(basedir, 'js');

    // Cached.compressedSnapshot.css = this.readdir(cssdir, 'css');
    // Cached.compressedSnapshot.js = this.readdir(jsdir, 'js');

    if (Cached.hasDirectory) {
      callback();
      return;
    }

    if (!fs.existsSync(basedir)) fs.mkdirSync(basedir);
    if (!fs.existsSync(cssdir)) fs.mkdirSync(cssdir);
    if (!fs.existsSync(jsdir)) fs.mkdirSync(jsdir);

    Cached.hasDirectory = true;

    callback();
  },

  createMinifyJs: function(scripts) {
    var rootedScripts = this.prependFolderToFiles(this.dirname, scripts);
    var code = uglify.minify(rootedScripts).code;
    var filename = path.join('js', md5(code) + '.js');
    this.srcScripts.push(filename);
    var srcScript = path.join(this.root, '.compressed', filename);
    
    this.createDirectories(function() {
      if (fs.existsSync(srcScript)) return;
      fs.writeFile(srcScript, code);
    });
  },

  createMinifyCss: function(styles) {
    var rootedStyles = this.prependFolderToFiles(this.root, styles);
    var code = uglifycss.processFiles(rootedStyles);
    var filename = path.join('css', md5(code) + '.css');
    this.srcStyles.push(filename);
    var srcStyle = path.join(this.root, '.compressed', filename);

    this.createDirectories(function() {
      if (fs.existsSync(srcStyle)) return;
      fs.writeFile(srcStyle, code);
    }.bind(this));
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
  },

  prependFolderToFiles: function(folder, files) {
    return files.map(function(file) {
      return path.join(folder, file);
    });
  },

  removeCacheFiles: function() {
    var garbage = [];

    garbage = garbage.concat(_.difference(this.prependFolderToFiles('css', Cached.compressedSnapshot.css), this.srcStyles));
    garbage = garbage.concat(_.difference(this.prependFolderToFiles('js', Cached.compressedSnapshot.js), this.srcScripts));

    garbage.forEach(function(file) {
      fs.unlinkSync(path.join(this.root, '.compressed', file));
    }.bind(this));
  },

  readdir: function(dir, ext) {
    if (!Cached.hasDirectory) {
      return [];
    }

    var content = fs.readdirSync(dir);

    if (!ext) {
      return content;
    }

    var extSize = ext.length;

    return content.filter(function(item) {
      return item.substr(-extSize) == ext;
    });
  }
};


module.exports = Compressor;
