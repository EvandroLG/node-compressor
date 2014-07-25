.PHONY:

install: install_node 

install_node:
	brew install node

test:
	@jasmine-node test
