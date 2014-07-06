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

module.exports = Params;