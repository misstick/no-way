var chai = (typeof require !== "undefined") ? require("chai") : chai;
var assert = chai.assert;
var expect = chai.assert;
describe('a suite of tests', function(){
  this.timeout(500);
  it('should take less than 500ms', function(done){
    setTimeout(done, 300);
  })

  it('should take less than 500ms as well', function(done){
    setTimeout(done, 200);
  })
});