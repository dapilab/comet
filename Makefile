NODE_BIN = ./node_modules/.bin

# Development
lint:
	@echo "Linting..."
	@$(NODE_BIN)/eslint .
lint-fix:
	@echo "Fix linting..."
	@$(NODE_BIN)/eslint --fix .
test: lint-fix
	@echo "Testing..."
	@$(NODE_BIN)/jest
dev:
	@echo "Starting dev server..."
	@NODE_ENV=development $(NODE_BIN)/webpack-dev-server --config ./webpack/development.js --progress
.PHONY: lint lint-fix dev

# Deployment
build:
	@echo "Building..."
	@rm -rf ./dist
	@NODE_ENV=production $(NODE_BIN)/webpack --config ./webpack/production.js --progress --bail
.PHONY: build
