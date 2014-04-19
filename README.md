# Node Compressor
A complete solution to compress static files with node

## Installation
```shell
  npm install node-compressor -g
```

## How it work?
It's a command line tool that receives as parameter an HTML file and compresses the JavaScript and CSS files called. 

The files that you want to compress must be between ``<!-- compress js/css -->`` and ``<!-- endcompress -->``. After, run this command in your Terminal:

```shell
  node-compressor -f=YOUR_FILE.html
```

Then, Node Compress will compress these files and deliver them within the directory ``.compressed``
