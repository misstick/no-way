describe('Gallery', function(){
    
    var view;
    
    // @FIXME : timout shouldnt be force
    // Get better performance
    this.timeout(2500);

    // @TODO : use fake pictures
    // @TODO : after makinh these test, factorise gallery.js
    // to make other test possible, easier
    
    beforeEach(function() {
        view = new PictureWall($("#test-content"));
    });
    
    afterEach(function() {
        view.destroy();
        view = undefined;
    });
    
    // @TEST: test the initial number of pictures Wall becomes an item
    
    // @TEST : this event should be called once
    // Listen to picture.load
    it('the event "load:success" should be called only once', function(done){
        var callback = sinon.spy();
        $(view.el).on("gallery:loaded", callback);
        var test = function() {
            assert.ok(callback.calledOnce);
            done();
        };
        $(view.el).on("gallery:loaded", _.debounce(test, 800));
        
        view.load();
    });
    
    // @TEST : format:end should be called once
    it('the event "format:end" should be called only once', function(){
        // @TODO : use a spy (load sinon.js)
        // to listen how many times this callback is called
        // it should be onely 1
    });
    
    // @TEST : test that coords are not undefined && typeof === number
    it('view.coords', function(){
        // @TODO : load a picture
        // Get its coords
        // make the test
    });
    
    // @TEST: test the initial number of pictures Wall.become item
    it('should have 24 pictures', function(){
        // @TODO : call view.items().length
    });
    
    // @TEST : Navigation bar should exist
    it('Navigation bar should exist', function(){
        // @TODO : find how to fake touch screen
    });
    
    // @TEST : landscape cases
    // look how many landscape cases there are
    // check ifdf gallery.landscape.length is the same
});
