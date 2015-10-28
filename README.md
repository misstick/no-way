no-way
======

Create blog based on middleman

## Developement Env.

### Install
To install all front-end frameworks, launch before start 
``` 
$ npm install bower
$ bower install
$ npm install --global mocha-phantomjs
$ npm install --global browserify
$ npm install --global babel
$ npm install --save react react-dom
```
### Compile
````
$ babel source/javascripts/modules --watch --out-dir source/javascripts/compiled
$ browserify -t babelify source/javascripts/compiled/init.js -o source/javascripts/bundle.js
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
npm update --global browserify
npm update --global babel
npm update react
npm update react-dom
```