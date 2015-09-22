import BaseView from './BaseView';
import NavView from './NavView';
export default ScrollerView;

    _.mixin({
        is_touch: function() {
            /* Modernizr 2.6.2 (Custom Build) | MIT & BSD
            * Build: http://modernizr.com/download/#-touch-shiv-cssclasses-teststyles-prefixes-load
            */
            return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
        }
    });

    var ScrollerView = function(el, options) {
        BaseView.apply(this, arguments);
    }
    
    ScrollerView.prototype = Object.create(BaseView.prototype);
    
    _.extend(ScrollerView.prototype, {
        
        grid: [],
        
        initialize: function(el, options) {
            BaseView.prototype.initialize.apply(this, arguments);
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
                this.__nav = new NavView(this.el);
                this.__nav.render();
            }
        },
        
        scroll_value: function() {
            var _value = this.el.get(0).scrollWidth - this.el.get(0).offsetWidth;
            return _value > 0;
        },
        
        columns: function(len, max) {
            var column = null;
            // Get full lines
            for (var counter=1; counter <= max; counter++) {
                if (len % counter == 0) {
                    column = counter;
                }
            }

            // Try to catch the more full lines as possible
            if (column == 1 && len > max) {
                for (var counter=max - 2; counter <= max; counter++) {
                    var _full_rows = Math.trunc(len / counter);
                    var _last_row_items = len - _full_rows * counter;
                    if (counter - _last_row_items == 1) {
                        column = counter;
                    }
                }
            }
            return column || column_max;
        },
        
        top: function(item, screen) {
            var _content = this.__content;
            var _value = _content.height() + _content.offset().top;
            var value = Math.ceil((screen.height - _value) / 2);
            return (value > 0) ? value : 0;
        },
        
        width: function(item, screen, len) {
            var columns_max_visible = Math.ceil(screen.width * 1.5 / item.width);
            var columns = this.columns(len, columns_max_visible);

            // var rows_min = Math.ceil(screen.height / item.height);
            // var rows = Math.ceil(len / columns);
            
            return columns * item.width;
        },
        
        styles: function(item, screen, len) {
            if (arguments.length == 0) {
                return {
                    "width": "auto",
                    "padding-top": "0"
                };
            }
            var _width = this.width(item, screen, len);
            var _top = this.top(item, screen, len);
            return {
                "width": _width,
                "padding-top": _top
            };
        },
        
        resize: function() {
            
            // Grid is a table with CID references
            // of models of collection
            var content = this.__content;
            var grid = this.grid;
            var collection = this.collection;
            
            // Remove Previous resize
            var _default_styles = this.styles();
            content.css(_default_styles);
            
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
                }.bind(this));
            }.bind(this));
            
            // Force Content.width
            // to have horizontal alignment
            var _styles = this.styles(item_ref_size, screen_size, items_len);
            content.css(_styles);
        }
    });
