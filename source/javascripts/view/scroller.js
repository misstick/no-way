(function(baseView, navView) {

    _.mixin({
        is_touch: function() {
            /* Modernizr 2.6.2 (Custom Build) | MIT & BSD
            * Build: http://modernizr.com/download/#-touch-shiv-cssclasses-teststyles-prefixes-load
            */
            return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
        }
    });
    
    var NAMESPACE = "scroller";
    
    var scrollerView = function(el, options) {
        baseView.apply(this, arguments);
    }
    
    scrollerView.prototype = Object.create(baseView.prototype);
    
    _.extend(scrollerView.prototype, {
        
        grid: [],
        
        initialize: function(el, options) {
            baseView.prototype.initialize.apply(this, arguments);
            var _func = this.resize.bind(this);
            $(window).on("resize", _.debounce(_func, 500));
        },
        
        render: function(html) {
            if (!this.__content) {
                $(this.el).html("<div class=scroller></div>");
                this.__content = $(".scroller", this.el);
            }
            
            var content = this.__content;
            
            if (_.isString(html)) {
                
                // Append new HTML
                content.html(html)
                
                // Display columns && rows
                this.resize();
            }
            if (!_.is_touch() && this.scroll_value()) {
                this.__nav = new navView(this.el);
                this.__nav.render();
            }
        },
        
        scroll_value: function() {
            var value = this.el.get(0).scrollWidth - this.el.get(0).offsetWidth;
            return value > 0;
        },
        
        get_width: function() {
            // return this.grid.length * item_ref.width;
            var width = 0;
            _.each(this.el.find("[data-content]"), function(el, index) {
                if (width < window.innerWidth) {
                    width += el.offsetWidth;
                }
            });
            return width;
        },
        
        resize: function() {
            var content = this.__content;
            
            // Grid is a table with CID references
            // of models of collection
            var grid = this.grid;
            var collection = this.collection;
            
            // Remove Previous resize
            content.css("width", "auto");
            
            var item_ref = collection.get_grid_ref({
                "width": window.innerWidth,
                "height": window.innerHeight
            });
            
            // console.log("REF", item_ref)
            
            // Resize Grid Items
            _.each(grid, function(data) {
                _.each(data, function(cid, index) {
                    var item = $('[data-cid=' + cid + ']', this.el);
                    
                    // Resize Picture
                    var model = _.find(collection.models, function(_model) {
                        return _model.cid == cid;
                    });
                    
                    // console.log(model.width, model.height)
                    
                    var is_no_portrait = model.format == "landscape" && data.length == 1 && item_ref.format != "landscape";
                    
                    // Resize Container
                    if (!index) {
                        // When there is only 1 "landscape" picture, 
                        // container is twice larger than a "portrait"
                        if (is_no_portrait) {
                            // @TODO : check that new width isnt too big compared to initial value
                            // This check should be done into (collection)grid.sort_by_format
                            $(item).parent().css({
                                "width": item_ref.width * 2,
                                "height": item_ref.height
                            });
                        } else {
                            $(item).parent().css(item_ref);
                        }
                    }
                    
                    var _styles = {
                        // "background-size": "<%= width %>px <%= height %>px",
                        "background-size": "100% auto",
                        "height": (data.length == 1) ? "100%" : "50%"
                    }
                    
                    if (model.format == "landscape") {
                        // var _background_size = "auto 100%";
                        //
                        // var _width = Math.ceil(item_ref.width * model.height / model.width);
                        // if (_width < model.width) {
                        //     _background_size = "100% auto";
                        // }
                        //
                        // console.log(model.order, _background_size)
                        //
                        // _.extend(_styles, {
                        //     "background-size": _background_size
                        // });
                    } else {
                        // _.extend(_styles, {
                     //        "background-size": _.template('<%= width %>px <%= height %>px', {
                     //            width: Math.ceil(item_ref.width),
                     //            height: Math.ceil(item_ref.height)
                     //        })
                     //    });
                    }

                    item.css(_styles);
                });
            });
            
            // Force Content.width
            // to have horizontal alignment
            // var width = this.get_width();
            // content.width(width);
        }
    });
    
    _VIEW[NAMESPACE]  = scrollerView;
    
})(_VIEW["base"], _VIEW["nav"]);

