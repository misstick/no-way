no-way
======

Create blog based on middleman

To install all front-end frameworks, launch before start 
``` 
npm install bower
bower install
npm install --global mocha-phantomjs
npm install --save-dev babel-core
npm install --global browserify
```
## Compiling
````
babel --optional reactCompat source/javascripts/modules --out-dir source/javascripts/compiled
browserify source/javascripts/compiled/init.js -o source/javascripts/bundle.js
```

## Unit-test : 
```
mocha-phantomjs source/test/index.html
```

To upgrade these frameworks :
``` 
npm install --global npm@latest
bower update
npm update --global mocha-phantomjs
npm install babel-core
npm update --global browserify
```