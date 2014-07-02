describe('Gallery', function(){
    var view = new PictureWall($("#test-content"));
    
    it('load:success', function(){
      view.load();
    });
});