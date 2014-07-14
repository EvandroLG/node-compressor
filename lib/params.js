'strict mode';


var Params = {
  args: process.argv.slice(2),
  files: [],

  read: function() {
    this.args.forEach(function(param) {
      var isRoot = param === '-r' || param === '--root';
      
      if(isRoot) {
        this.root = value;
        return;
      }

      this.files.push(param);

    }.bind(this));

    return this;
  }
};


module.exports = Params;
