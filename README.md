no-way
======

# Blog based on middleman

## Installation
``` 
npm install bower
bower install
npm install -g mocha-phantomjs
npm install babel-core
npm install -g browserify
```
## Compiling
````
babel javascripts/modules --out-dir javascripts/compiled
browserify javascripts/compiled/init.js -o javascripts/bundle.js
```

## Unit-test : 
```
mocha-phantomjs source/test/index.html
```

## Upgrade environement
``` 
npm install -g npm@latest
bower update
npm update -g mocha-phantomjs
```