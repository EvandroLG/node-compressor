# Node Compressor
A complete solution to compress static files with node inspired by [django-compressor](https://github.com/django-compressor/django-compressor)

## Installation
```shell
npm install node-compressor -g
```

## How it works?
It's a command line tool that receives as parameter an HTML file and compresses the JavaScript and CSS files called. It also minify the HTML file.

The files that you want to compress must be between `<!-- compress -->` and `<!-- endcompress -->`, for example, like this:

After, run this command in your Terminal:

```shell
node-compressor YOUR_FILE-1.html YOUR_FILE-2.html
```
```shell
node-compressor YOUR_FOLDER/*.html
```
```shell
node-compressor YOUR_FOLDER/**/*
```

Then, Node Compress will compress these files and deliver them within the directory ``.compressed``

## Example

Wrap the assets as you'd like them to be concatenated:

```html
<!-- compress js -->
<script src="foo/bar.js"></script>
<script src="lol/yey.js"></script>
<!-- endcompress -->

<!-- compress js -->
<script src="pow/go.js"></script>
<script src="cca/xyzzy.js"></script>
<!-- endcompress -->
```

After the compression the result will be like this:

```html
<script src="js/72b302bf297a228a75730123efef7c41.js"></script>
<script src="js/aca25d624cf863f786f67137c62aa11d.js"></script>
```