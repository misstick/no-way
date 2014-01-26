var chai = (typeof require !== "undefined") ? require("chai") : chai;
var assert = chai.assert;
var expect = chai.assert;



/*

TEST CASE

1.

*/

describe('Gallery', function(){
  var view = new PictureWall($("#test-content"));
  
  this.timeout(2000);
  it('load:success', function(){
    
    view.load();
    
    
  });
});