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
        
        top: function(item, screen) {
            var value = Math.ceil((screen.height - this.__content.height()) / 2);
            return (value > 0) ? value : 0;
        },
        
        width: function(item, screen, nb_items) {
            var columns = [];
            var column = null;
            for (var counter=1; counter<=nb_items; counter++) {
                if (nb_items % counter == 0) {
                    columns.push(counter);
                }
            }
            var counter;
            while((counter = columns.shift()) && column == null) {
                if(counter * item.width > screen.width) {
                    column = counter;
                }
            }
            return (column || nb_items) * item.width;
        },
        
        resize: function() {
            
            // Grid is a table with CID references
            // of models of collection
            var content = this.__content;
            var grid = this.grid;
            var collection = this.collection;
            
            // Remove Previous resize
            content.css({
                "width": "auto",
                "padding-top": "0"
            });
            
            var screen_size = {
                "width": window.innerWidth,
                "height": window.innerHeight
            };
            var item_ref_size = collection.get_grid_ref(screen_size);
            var items_len = this.collection.size();
            
            // Resize Grid Items
            _.each(grid, function(data) {
                
                // Item Real Size
                var _item_size = _.clone(item_ref_size);
                
                _.each(data, function(cid, index) {
                    
                    var item = $('[data-cid=' + cid + ']', this.el);
                    
                    var model = _.find(collection.models, function(_model) {
                        return _model.cid == cid;
                    });
                    
                    if (!index) {
                        var _is_twice_item = _item_size.format != "landscape" && model.format == "landscape" && data.length == 1;
                        if (_is_twice_item) {
                            // When there is only 1 "landscape" picture, 
                            // container is twice larger than a "portrait"
                            
                            // @TODO : check that new width isnt too big compared to initial value
                            // This check should be done into (collection)grid.sort_by_format
                            _.extend(_item_size, {
                                "width": _item_size.width * 2
                            });
                            ++items_len;
                        }
                        if (data.length == 2) {
                            _.extend(_item_size, {
                                "height": _item_size.height / 2
                            });
                            --items_len;
                        }
                    }
                    
                    // Background Positionning
                    var _styles = {
                        "background-size": "100% auto",
                        "height": _item_size.height,
                        "width": _item_size.width
                    }
                    var _height =  model.img_height || model.height;
                    var _width = model.img_width || model.width;
                    if (_height / _width < _item_size.height / _item_size.width) {
                        _styles["background-size"] = "auto 100%";
                    }
                    item.css(_styles);
                });
            });
            
            // Force Content.width
            // to have horizontal alignment
            this.el.width(this.width(item_ref_size, screen_size, items_len));
            this.el.css({
                "padding-top": this.top(item_ref_size, screen_size)
            });
        }
    });
    
    _VIEW[NAMESPACE]  = scrollerView;
    
})(_VIEW["base"], _VIEW["nav"]);

