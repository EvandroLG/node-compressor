'strict mode';


var Params = function() {
  this.args = process.argv.slice(2);
  this.files = [];
  this.read();
};

Params.prototype = {
  read: function() {
    this.args.forEach(function(param) {
      var isRoot = param === '-r' || param === '--root';
      
      if(isRoot) {
        this.root = value;
        return;
      }

      this.files.push(param);

      // if(isFile) {
      //   this.file = value;
      // }

      // if(isRoot) {
      //   this.root = value;
      // }

    }.bind(this));
  }
};


module.exports = Params;
