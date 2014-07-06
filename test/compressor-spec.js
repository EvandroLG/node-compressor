var sys = require('sys');
var fs = require('fs-extra');
var rimraf = require('rimraf');
var exec = require('child_process').exec;


describe('compressor', function() {

  beforeEach(function() {
    var fixtures = {};
    fixtures.html = 'test/fixtures/index.html';

    this.runCommand = function() {
      var command = 'node index -f={{ HTML }} -r=test/fixtures/'
                   .replace('{{ HTML }}', fixtures.html);

      exec(command);
    };

    this.verifyDirectoriesOrFiles = function(path) {
      this.runCommand();

      waits(200);

      runs(function() {
        var hasFile = fs.existsSync(path);
        expect(hasFile).toBeTruthy();
      });
    };
  });

  afterEach(function() {
    rimraf.sync('test/fixtures/.compressed/');
  });

  describe('html', function() {
    it('should create .compressed directory', function() {
      this.verifyDirectoriesOrFiles('test/fixtures/.compressed/');
    });

    it('should create index.html file in .compressed', function() {
      this.verifyDirectoriesOrFiles('test/fixtures/.compressed/index.html');
    });
  });

  
  describe('js', function() {
    it('should create directory js in .compressed', function() {
      this.verifyDirectoriesOrFiles('test/fixtures/.compressed/js/');
    });

    it('should exists two js files in .compressed', function() {
      this.runCommand();

      waits(200);

      runs(function() {
        var files = fs.readdirSync('test/fixtures/.compressed/js/');
        var totalFiles = files.length;

        expect(totalFiles).toEqual(2);
      });
    });
  });

});