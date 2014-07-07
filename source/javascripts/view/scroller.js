(function(baseView) {

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
			
			// Get Column Value
			var column_min = Math.ceil(content.width() / coords.width);
			var columns = column_min;
			while((len / columns) > 1 && len % columns > 0) {
				++columns;
			}
			var rows = Math.ceil(len / columns);
			
			
			console.log("resize", columns, rows);
			
			// @TODO : clean this part
			// is it still useless ?
			/*
			if (this._fill === "height") {
				// Gallery is bigger than window Size
				// Lets fill it
				var surface = coords.width * coords.height;
				var surface_all = surface * len;
				var surface_win = window.innerHeight * window.innerWidth;
				if (surface_all > surface_win && row === 1) {
					columns = column_min;
					rows = Math.ceil(len / column);
				}
			
				// Add Vertical Alignement
				var height_min = window.innerHeight;
				var height = rows * coords.height;
				this.el.css({
					"padding": Math.ceil((height_min - height) / 2) + "px 0"
				});
			}
			*/
			
			// Force Content.width
			// to have scroller
			var width = columns * coords.width;
			content.width(width);
			
			// Resize Grid Items
			_.each(grid, function(data) {
				_.each(data, function(cid, index) {
					var item = $('[data-cid=' + cid + ']', this.el);
					
					// Resize Container
					if (!index) {
						$(item).parent().css(coords);
					}
					
					// Resize Picture
					var model = _.find(collection.models, function(_model) {
						return _model.cid == cid;
					});
					
					var _height = item.height();
					var _width = Math.ceil(model.width * _height / model.height);
					if (_width < coords.width) {
						
						_height *=  coords.width / _width;
						_width = coords.width;
					}
					
					item.css({
						"background-size": _.template('<%= width %>px <%= height %>px', {
							width: _width,
							height: _height
						})
					});
				});
			});
		}
	});

	_VIEW[NAMESPACE]  = scrollerView;

})(_VIEW["base"]);

