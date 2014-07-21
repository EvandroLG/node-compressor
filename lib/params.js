'use strict';


var Params = {
  args: process.argv.slice(2),
  files: [],

  read: function() {
    var i = 0;
    var size = this.args.length;

    for (; i < size; i++) {
      var param = this.args[i];
      var isNextRoot = param === '-r' || param === '--root';

      if (isNextRoot) {
        var value = this.args[i+1];
        this.root = value;
        i = i + 2;
        break;
      }

      this.files.push(param);
    }

    return this;
  }
};


module.exports = Params;
