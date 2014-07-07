(function(baseView, baseCollection, gridCollection) {

	_.mixin({
		create_affix: function(el) {
			var coords = el.offset();
			if (!coords.top) el.addClass("affix");
			else el.affix({ offset: coords});
		},
		is_touch: function() {
			/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
			* Build: http://modernizr.com/download/#-touch-shiv-cssclasses-teststyles-prefixes-load
			*/
			return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
		}
	});
	
	// 
	// Loader
	// Handle Content loading 
	// 

	var Loader = function(el, options) {
		baseView.apply(this, arguments);
	}

	Loader.prototype = Object.create(baseView.prototype);

	_.extend(Loader.prototype, {
		
		initialize: function(el, options) {
			baseView.prototype.initialize.apply(this, arguments);
			$(this.el).on("load:start", this.start.bind(this));
			$(this.el).on("load:stop", this.stop.bind(this));
		},

		start: function() {
			$(this.el).addClass("load");
		},
		
		stop: function() {
			$(this.el).removeClass("load");
		},
		
		is_loaded: function(el) {
			return !!el.offsetWidth;
		},
		
		data: function(el) {
			return {
				src: el.src,
				width: el.offsetWidth,
				height: el.offsetHeight,
				order: el._index
			};
		},
		
		render: function() {
			$(this.el).trigger("load:start");
			
			var items = $("img", this.el);
			
			var _complete = _.after(items.length, function() {
				this.collection.sort();
				$(this.el).trigger("load:stop");
			}.bind(this));
			
			var _save = function(event) {
				var el = event.target;
				var data = this.data(el);
				this.collection.add(data);
				_complete();
			}.bind(this);
			
			// Get real picture size
			// and launch render after that
			items.each(function(index, el){
				el._index = index;
				if (!this.is_loaded(el)) {
					el.onload = _save;
					return;
				}
				_save({target: el});
				
			}.bind(this));
		}
	});
	
	var Scroller = function(el, options) {
		baseView.apply(this, arguments);
	}
	
	Scroller.prototype = Object.create(baseView.prototype);
	
	_.extend(Scroller.prototype, {
		
		grid: [],
		
		initialize: function(el, options) {
			baseView.prototype.initialize.apply(this, arguments);
			var _func = this.resize.bind(this);
			$("body").on("resize", _.debounce(_func, 100));
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
			// if (width > width_max) width = width_max;
			content.width(width);
			console.log(columns, coords.width, width)
			
			// Resize Grid Items
			// @TODO : add methods
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
					$(item).css({
						"background-size": _.template('<%= width %>px <%= height %>px', {
							width: data.width * item.offsetHeight / data.height,
							height: item.offsetHeight
						})
					});
				});
			});
		}
	});
	
	//
	// View: PictureWall
	// Handle format: landscape/portrait
	// Set pictures close together
	// Save picture positions
	//

	var PictureWall = function(el, options) {
		baseView.apply(this, arguments);
	}

	PictureWall.prototype = Object.create(baseView.prototype);

	_.extend(PictureWall.prototype, {
		
		collection: new gridCollection(),
		
		initialize: function(el, options) {
			
			baseView.prototype.initialize.apply(this, arguments);
			
			this._fill = this.el.data("fill") || "width";
			
			$(this.el).on("load:stop", this.render.bind(this));
			$(this.el).on("resize", this.set_nav.bind(this));
			
			// @FIXME : put this in the future into render
			// when all methods will be cleanedup && renamed
			this.__loader = new Loader(this.el, {
				collection: this.collection
			});
			this.__loader.render();
			
			this.__scroller = new Scroller(this.el, {
				collection: this.collection
			});
		},

		// @TODO : Create a new component to handle navigation
		// @TEST : Navigation bar should exist
		// on nonetouch resolutions
		set_nav: function() {
			if (_.is_touch() || this.el.get(0).scrollWidth === this.el.get(0).offsetWidth) return;
			
			// Display Visibility
			var display_buttons = function() {
				var min = 0;
				var max = this.el.get(0).scrollWidth - this.el.get(0).offsetWidth;
				var value = this.el.get(0).scrollLeft;
				
				$("[data-action=next]")[(value === max) ? "addClass" : "removeClass"]("disabled");
				$("[data-action=back]")[(value === min) ? "addClass" : "removeClass"]("disabled");
				
			}.bind(this);
			
			var _goto = function(event) {
				var target = event.currentTarget;
				var action = $(target).data("action");
				var step = this.el.width() / 2;
				var value = (action === "next") ? this.el.get(0).scrollLeft + step : this.el.get(0).scrollLeft - step;
		
				// ANimation
				this.el.animate({ "scrollLeft": value}, { complete: display_buttons});
			}.bind(this);
		
			// Add navigation
			this.el.append('<nav><button data-action="back"><button data-action="next"></nav>');
			_.create_affix($("nav", this.el));
			
			// Handle Click Event
			$("button", this.el).on("click", _goto);
			
			// Handle Scroll Event
			$(this.el).on("scroll", _.throttle(display_buttons, 100))
			
			$(this.el).trigger("scroll");
			$(this.el).off("resize");
		},

		/*
			Purpose : Find the reference scale of the grid.
			Which is : the 1st portrait element
			
			1. define & save each picture format into a collection/model
			2. Find the first portrait with a method of this collection
			3. How to handle "this._clean" ???
		*/

		render: function(event, options) {
			
			var _grid = [];
			
			var _all_content = '';
			
			var _success = _.debounce(function(data) {
				this.__scroller.grid = _grid;
				this.__scroller.render.call(this.__scroller, _all_content)
			}.bind(this), 200);
			
			var _render = function(data) {
				// it depends of screen size
				// 1 screen height == 2.5 rows
				var content = '';
				var model0 = data;
				var template0 = '<div data-content="<%= type %>">';
				var template1 = '<div class="image <%= format %>" data-cid="<%= cid %>" style="background-image: url(\'<%= src %>\');"></div>';
				var template2 = '</div>';
				
				if (_.isArray(data)) {
					model0 = data[0];
					_.each(data, function(model) {
						content += _.template(template1, model);
					});
				} else {
					content = _.template(template1, model0);
				}
				_all_content += _.template(template0, model0) + content + _.template(template2, model0);
				
				// Save Grid
				var cid = _.isArray(data) ? _.pluck(data, "cid") : [data.cid];
				_grid.push(cid);
				
				// Change Grid size
				_success();

			}.bind(this);
				
			// Transform data into DOM
			this.collection.sort_by_format(_render);
		}

	});
	
	this.PictureWall = PictureWall;

})(_VIEW["base"], _COLLECTION["base"], _COLLECTION["grid"]);

