var sys = require('sys');
var fs = require('fs-extra');
var rimraf = require('rimraf');
var exec = require('child_process').exec;


describe('compressor', function() {

  beforeEach(function() {
    var fixtures = {};
    fixtures.html = 'test/fixtures/index.html';

    this.runCommand = function(callback) {
      var command = 'node index {{ HTML }} -r=test/fixtures/'
                   .replace('{{ HTML }}', fixtures.html);

      exec(command, callback);
    };

    this.verifyDirectoriesOrFiles = function(path, done) {
      this.runCommand(function() {
        var hasFile = fs.existsSync(path);
        expect(hasFile).toBeTruthy();
        if (done) done();
      });
    };
  });

  afterEach(function() {
    rimraf.sync('test/fixtures/.compressed/');
  });

  describe('html', function() {
    it('should create .compressed directory', function(done) {
      this.verifyDirectoriesOrFiles('test/fixtures/.compressed/', done);
    });

    it('should create index.html file in .compressed', function(done) {
      this.verifyDirectoriesOrFiles('test/fixtures/.compressed/index.html', done);
    });
  });

  
  describe('js', function() {
    it('should create directory js in .compressed', function(done) {
      this.verifyDirectoriesOrFiles('test/fixtures/.compressed/js/', done);
    });

    it('should exists two js files in .compressed', function(done) {
      this.runCommand(function() {
        var files = fs.readdirSync('test/fixtures/.compressed/js/');
        var totalFiles = files.length;

        expect(totalFiles).toEqual(2);
        done();
      });
    });
  });

  describe('css', function() {
    it('should create directory css in .compressed', function(done) {
      this.verifyDirectoriesOrFiles('test/fixtures/.compressed/css/', done);
    });

    it('should exist one css file in .compressed', function(done) {
      this.runCommand(function() {
        var files = fs.readdirSync('test/fixtures/.compressed/css/');
        var totalFiles = files.length;

        expect(totalFiles).toEqual(1);
        done();
      });
    });
  });

});