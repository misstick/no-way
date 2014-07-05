(function() {

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
	
	var Coords = function(data) {
		this.initialize(data || null);
	}
	
	Coords.prototype = {
		
		// @TODO : add another property 
		// to save new size : 
		// (default) .__size: {width: , height},
		// (final) .size: {width: , height},
		
		// @FIXME : add DOM order (is different than load order)
		defaults: {
			src: null,
			width: 0,
			height: 0,
			format: "portrait",
			type: "picture"
		},
		
		models: [],
		
		initialize: function(data) {
			if (data) {
				this.add(data);
			}
		},
		
		add: function(data, options) {
			var options = options || {};
			if (!data && data !== undefined) {
				return;
			}
			if (_.isArray(data)) {
				_.each(data, function(model) {
					this.add(model);
				}.bind(this));
				return;
			}
			
			var attributes = _.clone(this.defaults);
			_.extend(attributes, data);
			attributes = this.validate(attributes, options);
			if (attributes) {
				attributes.cid = "C" + this.models.length;
				this.models.push(attributes);
			}
		},
		
		validate: function(data, options) {
			data.format = (data.width >= data.height) ? "landscape" : "portrait";
			
			// @FIXME : remove empty values
			// save no empty data
			// var attributes = _.map(data, function(value, key) {
			// 	
			// 	return !_.isEmpty(value);
			// });
			
			return data;
		},
		
		sort: function() {
			if (this.models.length > 1) {
				var model0 = _.first(this.models);
				var model1 = _.last(this.models);
				
				// Handle Portrait pictures
				var is_portrait = model1.format == "portrait";
				var is_smaller = model1.width < model0.width;
				
				if (is_portrait && is_smaller) {
					this.models.unshift(model1);
					this.models.pop();
				}
			}
		},
		
		sort_by_format: function(callback) {
			var callback = callback || function(data) { return data; };
			return _.map(this.models, function(model, index, list) {
				if (model.format != "portrait") {
					
					var _list = list.slice(index + 1, list.length);
					var next = _.findWhere(_list, {format: "landscape"});
					if (next) {
						list.splice(_.indexOf(list, next), 1);
						return callback([model, next]);
					}
					return callback([model]);
				}
				return callback(model);
			});
		},
		
		get: function(index) {
			return this.models[index];
		},
		
		remove: function() {
			
		}
	};

	// 
	// Loader
	// Handle Content loading 
	// 

	var Loader = function(el, options) {
		if (el) {
			this.initialize(el, options);
		}
	}

	Loader.prototype = {
		
		initialize: function(el, options) {
			this.el = el;
			this.collection = options.collection;
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
		
		// @TODO : create a couple Collection/model
		// to handle this as data
		set_data: function(el) {
			$(el).attr("width", el.offsetWidth);
			$(el).attr("height", el.offsetHeight);
			return {
				src: el.src,
				width: el.offsetWidth,
				height: el.offsetHeight
			};
		},
		
		render: function() {
			$(this.el).trigger("load:start");
			
			var items = $("img", this.el);
			
			var _complete = _.after(items.length, function() {
				$(this.el).trigger("load:stop");
			}.bind(this));
			
			var _save = function(event) {
				var el = event.target;
				var data = this.set_data(el);
				this.collection.add(data);
				
				// Find the smaller "portrait" picture
				// and keepit as a reference
				this.collection.sort();
				
				_complete();
			}.bind(this);
			
			// Get real picture size
			// and launch render after that
			items.each(function(index, el){
				if (!this.is_loaded(el)) {
					el.onload = _save;
					return;
				}
				_save({target: el});
				
			}.bind(this));
		}
	};
	
	var Scroller = function(el, options) {
		if (el) {
			this.initialize(el, options);
		}
	}
	
	Scroller.prototype = {
		
		initialize: function(el, options) {
			this.el = el;
			this.collection = options.collection;
			var _func = this.resize.bind(this);
			$("body").on("resize", _.debounce(_func, 100));
		},
		
		render: function() {
			$(this.el).html("<div class=scroller></div>");
			this.__content = $(".scroller", this.el);
		},
		
		items: function() {
			return this.__content.children();
		},
		
		resize: function() {
			var content = this.__content;
			
			var coords = this.collection.get(0);
			
			// Remove Previous resize
			content.css("width", "auto");
		
		/*
			// Get Column Value
			var items = this.items();
			var width_max = 0;
			items.each(function(index, item) {
				width_max += $(item).width();
			});
			var len = width_max / coords.width;
			var column_min = Math.ceil(content.width() / coords.width);
			var column = column_min;
			while((len / column) > 1 && len % column > 0) {
				++column;
			}
		
			var row = Math.ceil(len / column);
			
		
			if (this._fill === "height") {
				
		
				// Gallery is bigger than window Size
				// Lets fill it
				var surface = coords.width * coords.height;
				var surface_all = surface * len;
				var surface_win = window.innerHeight * window.innerWidth;
				if (surface_all > surface_win && row === 1) {
					column = column_min;
					row = Math.ceil(len / column);
				}
		
				// Add Vertical Alignement
				var height_min = window.innerHeight;
				var height = row * coords.height;
				this.el.css({
					"padding": Math.ceil((height_min - height) / 2) + "px 0"
				});
			}
		
			// Resize Content
			var width = column * coords.width;
			if (width > width_max) width = width_max;
			content.width(width);
*/
		}
	}
	
	//
	// View: PictureWall
	// Handle format: landscape/portrait
	// Set pictures close together
	// Save picture positions
	//

	var PictureWall = function(el, options) {
		if (!options) options = {};
		if (el) {
			this.initialize(el, options);
		}
	}
	
	
	// 	
	// @TODO : transform this prototype
	// into a BackBone.view, Backbone.model
	// Use Events to be able to test the controller easily	
	// 
	PictureWall.prototype = {
		
		collection: new Coords(),
		
		initialize: function(el, options) {
			this.el = el;
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
		
		/*
		// @TEST : test that coords are not undefined && typeof === number
		// @ TODO : create collection/model to handle this
		// as data (cf Loader.save)
		coords: function(el) {
			return {
				width: el.offsetWidth,
				height: el.offsetHeight
			}
		},
		get_picture: function(el) {
			if (el.get !== undefined ) el = el.get(0);
			var tagName = el.tagName.toLowerCase();
			if (tagName != "img") {
				var test = $("img", el);
				return (!test.get(0)) ? $(".image", el) : test;
			}
			return $(el);
		},

		items: function() {
			return this.__scroller.items();
		},
*/

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
		// @FIXME : create a prevate method into .render
		// and remove it
		replace_picture: function(el, options) {
			if (el === undefined || !el) {
				return false;
			}
			if (!options) options = {};
			var style = {
				"width": options.coords.width,
				"height": options.coords.height,
				"background-repeat": "no-repeat",
				"background-position": "50% 50%",
				"background-image": "url('" + $(el).attr("src") + "')"
			};

			// Create a new container
			// if el is a picture
			var parent = $(el.parentNode);
			if (parent.attr("data-format") !== undefined || parent.hasClass("scroller")) {
				parent.append("<div class='image'>");
				parent = $(".image").last();
			} else {
				parent.addClass("image")
			}
			parent.css(style);
			parent.data("src", $(el).attr("src"));
			// Save initaila-size
			var coords = this.coords(el);
			$(parent).attr("data-size", coords.width + "|" + coords.height);
			
			$(el).remove();
			return parent.get(0);
		},
		
		// @FIXME: replace with "model.__size"
		// and remove this method
		item_size: function (el) {
			var value = $(el).attr("data-size");
			if (value) {
				value = value.split("|");
				return {
					width: value[0] * 1,
					height: value[1] * 1
				}
			}
			return this.coords(el);
		},

		background_size: function(el) {
			var coords = this.item_size(el);
			var coords0 = this.coords(el);

			// Picture isnt large enought
			if (coords.width < coords0.width) {
				var width = Math.round(coords.width * coords0.height / coords.height);
				return (width < coords0.width) ? "100% auto" : "auto 100%";
			}
			// Picture height isnt tall enought
			if (coords.height < coords0.height) {
				var width = Math.round(coords.width * coords0.height / coords.height);
				if (width >= coords0.width) {
					return width + "px " + coords0.height + "px";
				}
			}
			return coords.width + "px " + coords.height + "px";
		},
		
		
		/*
			Purpose : Find the reference scale of the grid.
			Which is : the 1st portrait element
			
			1. define & save each picture format into a collection/model
			2. Find the first portrait with a method of this collection
			3. How to handle "this._clean" ???
		*/

		render: function(event, options) {
			
			// Create Container
			this.__scroller.render();
			
			var container = this.__scroller.__content;
			var coords = this.collection;

			var _render = function(data) {
				// @TODO : handle 2 values of size
				// it depends of screen size
				// 1 screen height == 2.5 rows
				var content = '';
				var model0 = data;
				var template0 = '<div data-format="<%= format %>" data-content="<%= type %>">';
				var template1 = '<div class="image" style="background-image: url(\'<%= src %>\'); width: <%= width %>px; height: <%= height %>px;"></div>';
				var template2 = '</div>';
				
				// @FIXME : create a <div> instead
				// see "replace_picture" methods
				
				if (_.isArray(data)) {
					model0 = data[0];
					_.each(data, function(model) {
						content += _.template(template1, model);
					});
				} else {
					content = _.template(template1, model0);
				}
				content = _.template(template0, model0) + content + _.template(template2, model0);
				container.append(content);
				
			}.bind(this);
			
			// Transform data into DOM
			var plop = coords.sort_by_format(_render);

			// @FIXME : Whatfor ?
			$("body").trigger("resize");
		},
		
		destroy: function() {
			console.log("destroy")
		}

	}
	
	window.PictureWall = PictureWall;
})()

