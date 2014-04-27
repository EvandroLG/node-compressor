var sys = require('sys');
var fs = require('fs-extra');
var rimraf = require('rimraf');
var exec = require('child_process').exec;


describe('compressor', function() {

  beforeEach(function() {
    var fixtures = {};
    fixtures.html = 'test/fixtures/index.html';

    this.verifyDirectoriesOrFiles = function(path) {
      var command = 'node compressor -f={{ HTML }} -r=test/fixtures/'
                   .replace('{{ HTML }}', fixtures.html);

      exec(command);

      waits(200);

      runs(function(){
        var hasFile = fs.existsSync(path);
        expect(hasFile).toBeTruthy();
      });
    };
  });

  it('should create .compressed directory', function() {
    this.verifyDirectoriesOrFiles('test/fixtures/.compressed/');
  });

  it('should create index.html file in .compressed', function() {
    this.verifyDirectoriesOrFiles('test/fixtures/.compressed/index.html');
  });

  it('should create directory js in .compressed', function() {
    this.verifyDirectoriesOrFiles('test/fixtures/.compressed/js/');
  });

  it('should exists two js files in .compressed', function() {
    var files = fs.readdirSync('test/fixtures/.compressed/js/');
    var totalFiles = files.length;

    expect(totalFiles).toEqual(2);
  });

});