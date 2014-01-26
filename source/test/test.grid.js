var chai = (typeof require !== "undefined") ? require("chai") : chai;
var assert = chai.assert;
var expect = chai.assert;


describe('Array', function(){
  before(function(){
    
    var el = $("body").append('<div class="diaporama"></div>')
    
    
    var wall = new PictureWall(el);
    console.log("before", wall);
    
    
  });

  it('should take less than 500ms', function(done){
    setTimeout(done, 300);
  })
  
  it('should take less than 500ms as well', function(done){
    setTimeout(done, 200);
  })
});