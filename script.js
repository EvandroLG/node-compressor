#! /usr/bin/env node

var fs = require('fs');
var uglify = require('uglify-js');

var extractSource = function(line) {
  var re = /src=[\'|\"](.*)[\'|\"]/;
  var src = line.match(re)[1];

  return 'app/' + src;
};

var guid = function() {
  var s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  };

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
};

var createMinifyScript = function(scripts) {
  var code = uglify.minify(scripts).code;
  var fileName = gui() + '.js' ;
  fs.writeFile(fileName, code);
};

var saveScripts = function(content, i) {
  var scripts = [];
  var size = content.length;

  for (; i < size; i++) {
    var line = content[i];
    var isEndCompress = line.indexOf('endcompress') !== -1;

    if (isEndCompress) {
      break;
    }

    var src = extractSource(line);
    scripts.push(src);
  }

  createMinifyScript(scripts);
};

var main = function(err, data) {
  var content = data.split('\n');
  var i = 0;
  var size = content.length;

  for (; i < size; i++) {
    var line = content[i];
    var isCompress = line.indexOf('compress js') !== -1;

    if (isCompress) {
      saveScripts(content, i+1);
    }
  }
};

var args = process.argv.slice(2);
var file;

args.forEach(function(param) {
  var splited = param.split('=');
  var key = splited[0];
  var value = splited[1];
  var isFile = key === '-f' || key === '--file';

  if(isFile) {
    file = value;
  }

});

fs.readFile(file, 'utf8', main);