.SILENT:

install: install_uglify

install_node:
	brew install node

install_npm:
	curl https://npmjs.org/install.sh | sudo sh

install_uglify:
    npm install uglify-js@1