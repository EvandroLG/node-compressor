#! /usr/bin/env node

var fs = require('fs');
var uglify = require('uglify-js');

var extractSource = function(line) {
  var re = /src=\".*\"/;
  var src = re.exec(line)[0]
              .replace('src="', '').replace('"', '');

  return 'app/' + src;
};

var createMinifyScript = function(scripts) {
  var code = uglify.minify(scripts).code;
  fs.writeFile('default.js', code);
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

fs.readFile('app/index.html', 'utf8', main);