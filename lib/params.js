'strict mode';


var Params = function() {
  this.args = process.argv.slice(2);
  this.read();
};

Params.prototype = {
  read: function() {
    this.args.forEach(function(param) {
      var splited = param.split('=');
      var key = splited[0];
      var value = splited[1];
      var isFile = key === '-f' || key === '--file';
      var isRoot = key === '-r' || key === '--root';

      if(isFile) {
        this.file = value;
      }

      if(isRoot) {
        this.root = value;
      }

    }.bind(this));
  }
};


module.exports = Params;
