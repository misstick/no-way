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
		
		resize: function() {
			var content = this.__content;
			
			// Grid is a table with CID references
			// of models of collection
			var grid = this.grid;
			var collection = this.collection;
	
			// Remove Previous resize		
			content.css("width", "auto");
			
			var coords = collection.get_item_size({
				width: window.innerWidth,
				height: window.innerHeight
			});
			
			var width_max = coords.width * grid.length;
			var len = width_max / coords.width;
		
            // // Add Vertical Alignement
            // var height_min = window.innerHeight;
            // var height = rows * coords.height;
            // this.el.css({
            //     "padding": Math.ceil((height_min - height) / 2) + "px 0"
            // });
			
			// Force Content.width
			// to have scroller
            var width = grid.length * coords.width;
            content.width(width);
            
			// Resize Grid Items
			_.each(grid, function(data) {
				_.each(data, function(cid, index) {
					var item = $('[data-cid=' + cid + ']', this.el);
					
					// Resize Picture
					var model = _.find(collection.models, function(_model) {
						return _model.cid == cid;
					});
					
					// Resize Container
					if (!index) {
                        
                        // When there is only 1 "landscape" picture, 
                        // container is twice larger than a "portrait"
                        if (model.format == "landscape" && data.length == 1) {
    						$(item).parent().css({
    						    width: coords.width * 2,
                                height: coords.height
    						});
                            item.css({
                                "background-size": "auto 100%",
                                "height": coords.height
                            });
                            return;
                        } 

						$(item).parent().css(coords);
					}
                    
					var _height = item.height();
                    
                    // FIX : clean width a model method (get_img_width, et get_img_height)
					var _width = (model.img_width || model.width) * _height / (model.img_height || model.height);
					if (_width < coords.width) {
						_height *=  coords.width / _width;
						_width = coords.width;
					}
                    
                    item.css({
                        "background-size": _.template('<%= width %>px <%= height %>px', {
                            width: Math.ceil(_width),
                            height: Math.ceil(_height)
                        })
                    });

				});
			});
		}
	});

	_VIEW[NAMESPACE]  = scrollerView;

})(_VIEW["base"], _VIEW["nav"]);

