'strict mode';


var fs = require('fs-extra');
var rimraf = require('rimraf');
var path = require('path');
var colors = require('colors');
var uglify = require('uglify-js');
var ClearCss = require('clean-css');
var htmlMinifier = require('html-minifier');


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


var Compressor = function(err, data, root, file) {
  this.file = file;
  this.root = root;
  this.srcScripts = [];
  this.srcStyles = [];
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
    var pathfile = this.root + '.compressed/' + path.basename(this.file);

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
    if (this.hasDirectory) {
      callback();
      return;
    }

    rimraf.sync(this.root + '.compressed');
    fs.mkdirSync(this.root + '.compressed/');
    fs.mkdirSync(this.root + '.compressed/js');
    fs.mkdirSync(this.root + '.compressed/css');

    this.hasDirectory = true;

    callback();
  },

  createMinifyJs: function(scripts) {
    var code = uglify.minify(scripts).code;
    var filename = 'js/' + guid() + '.js';
    this.srcScripts.push(filename);
    var srcScript = this.root + '.compressed/' + filename;
    
    this.createDirectories(function() {
      fs.writeFile(srcScript, code);
    });
  },

  createMinifyCss: function(styles) {
    var root = this.root;
    var totalStyle = styles.length -1;
    var source = '';

    styles.forEach(function(src, index) {
      var currentStyle = root + src;

      fs.readFile(currentStyle, 'utf-8', function(err, data) {
        source += data;

        var isLast = totalStyle === index;
        if(!isLast) return;

        var filename = 'css/' + guid() + '.css';
        var srcStyle = root + '.compressed/' + filename;
        var code = new ClearCss().minify(source);
        this.srcStyles.push(filename);

        this.createDirectories(function() {
          fs.writeFile(srcStyle, code);
        });
      }.bind(this));
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

      var src = this.root + this.extractSource(line);

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


module.exports = Compressor;
