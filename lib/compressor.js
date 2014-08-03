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

var Compressor = function(err, data, root, file) {
  this.cacheVariables(root, file);

  var content = data.split('\n');
  var i = 0;
  var size = content.length;
  var files = [];
  var compress, getFile;

  for (; i < size; i++) {

    var line = content[i];

    compress = line.indexOf('compress') !== -1 ? true : false;

    if ( compress ) getFile = getFile ? false : true;

    if ( getFile ) {
    
      var file = this.extractFile(content[i]);  
      if ( file ) files.push( file );
    
    } else if( line.length && compress && !getFile && files.length ) {

      this.createMinify(files);

      files = [];

    }

  }

  if ( this.srcScripts.length || this.srcStyles.length ) this.copyPage();

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
        regex: /<!\-\- compress \-\->(.*?)<!\-\- endcompress \-\->/,
        list: this.srcScripts
      },

      css: {
        file: '<link rel="stylesheet" type="text/css" href="{{ SRC }}">',
        regex: /<!\-\- compress \-\->(.*?)<!\-\- endcompress \-\->/,
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

    if (!fs.existsSync(basedir)) fs.mkdirSync(basedir);
    if (!fs.existsSync(cssdir)) fs.mkdirSync(cssdir);
    if (!fs.existsSync(jsdir)) fs.mkdirSync(jsdir);

    callback();
  },

  createMinify: function(files) {

    var rootedFiles = this.prependFolderToFiles(this.dirname, files.map( this.extractSource ));

    switch( files[0].type ) {

      case 'css' :
        var code = uglifycss.processFiles(rootedFiles);
        var filename = path.join('css', md5(code) + '.css');
        this.srcStyles.push(filename);
        var srcStyle = path.join(this.root, '.compressed', filename);

        this.createDirectories(function() {
          if (fs.existsSync(srcStyle)) return;
          fs.writeFile(srcStyle, code);
        }.bind(this));
      
        break;

      case 'js' :
        var code = uglify.minify(rootedFiles).code;
        var filename = path.join('js', md5(code) + '.js');
        this.srcScripts.push(filename);
        var srcScript = path.join(this.root, '.compressed', filename);
        
        this.createDirectories(function() {
          if (fs.existsSync(srcScript)) return;
          fs.writeFile(srcScript, code);
        });
        
        break;

    }

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
    var rootedStyles = this.prependFolderToFiles(this.dirname, styles);
    var code = uglifycss.processFiles(rootedStyles);
    var filename = path.join('css', md5(code) + '.css');
    this.srcStyles.push(filename);
    var srcStyle = path.join(this.root, '.compressed', filename);

    this.createDirectories(function() {
      if (fs.existsSync(srcStyle)) return;
      fs.writeFile(srcStyle, code);
    }.bind(this));
  },

  extractFile: function(line) {
    var re = /(\bsrc\b|\bhref\b)=[\'|\"](.*?\.(.*?))[\'|\"]/;
    var match = line.match(re);
    
    if (match) return { src: match[2], type: match[3] };

    return null;
  },

  extractSource: function(data) {
    return data.src;
  },

  prependFolderToFiles: function(folder, files) {
    return files.map(function(file) {
      return path.join(folder, file);
    });
  },

  readdir: function(dir, ext) {

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
