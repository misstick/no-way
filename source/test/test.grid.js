describe('Gallery', function(){
    
    // @FIXME : timout shouldnt be force
    // Get better performance
    this.timeout(3500);

    // @TODO : use fake pictures
    // @TODO : after makinh these test, factorise gallery.js
    // to make other test possible, easier
    
    // @TEST : this event should be called once
    // Listen to picture.load
    it('the event "load:success" should be called only once', function(done){
        var view = new PictureWall($("#test-content"));

        var callback = sinon.spy();
        $(view.el).on("gallery:loaded", callback);
        var test = function() {
            assert.ok(callback.calledOnce);
            done();
        };
        $(view.el).on("gallery:loaded", _.debounce(test, 2000));
        
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