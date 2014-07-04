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
		
		defaults: {
			src: null,
			width: 0,
			height: 0,
			format: null
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
			_.extend(this.defaults, data);
			var attributes = this.validate(data, options);
			attributes.cid = "C" + this.models.length;
			this.models.push(attributes);
		},
		
		validate: function(data, options) {
			data.format = (data.width >= data.height) ? "portrait" : "paysage";
			
			
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
				var is_portrait = model1.format == "portrait";
				var is_smaller = model1.width < model0.width;
				if (is_portrait && is_smaller) {
					this.models.unshift(model1);
					this.models.pop();
				}
			}
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
		save: function(el) {
			$(el).attr("width", el.offsetWidth);
			$(el).attr("height", el.offsetHeight);
		},
		
		render: function() {
			$(this.el).trigger("load:start");
			
			var items = $("img", this.el);
			
			var _complete = _.after(items.length, function() {
				$(this.el).trigger("load:stop");
			}.bind(this));
			
			var _save = function(el) {
				this.save(el);
				_complete();
			}.bind(this);
			
			// Get real picture size
			// and launch render after that
			items.each(function(index, el){
				if (!this.is_loaded(el)) {
					el.onload = function(event) {
						_save(event.target);
					};
					return;
				}
				_save(el);
				
			}.bind(this));
		}
	};
	
	var Scroller = function(el, options) {
		if (el) {
			this.initialize(el, options);
		}
	}
	
	Scroller.prototype = {
		
		previous_html: null,
		
		initialize: function(el, options) {
			this.el = el;
			this.collection = options.collection;
			var _func = this.resize.bind(this);
			$("body").on("resize", _.debounce(_func, 100));
		},
		
		render: function() {
			// @FIXME : save it  into a fragment
			// to restore it after a destroy
			if (!this.previous_html) {
				var content = $(this.el).html();
				$(this.el).html("<div class=scroller></div>");
				this.__content = $(".scroller", this.el);
				this.__content.append(content);
				this.previous_html = content;
			}
			
		},
		
		items: function() {
			return this.__content.children();
		},
		
		resize: function() {
			var content = this.__content;
			
			var coords = this.collection.get(0);
			
			// Remove Previous resize
			content.css("width", "auto");
		
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
			
			$(this.el).trigger("resize");
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
		
		min_screen: "700",

		min_width: "730", // Mobile Resolution

		format: ["portrait", "landscape"],
		
		collection: new Coords(),

		// @FIXME : remove this tricky/creepy option
		_clean: true,
		
		initialize: function(el, options) {
			this.el = el;
			this._fill = this.el.data("fill") || "width";
			
			$(this.el).on("load:stop", this.format_html.bind(this));
			$(this.el).on("format:end", this.render.bind(this));
			$(this.el).on("resize", this.set_nav.bind(this));
			
			this.__scroller = new Scroller(this.el, {
				collection: this.collection
			});
			
			// @FIXME : put this in the future into render
			// when all methods will be cleanedup && renamed
			this.__loader = new Loader(this.el, {
				collection: this.collection
			});
			this.__loader.render();
		},
		
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

		set_format: function(el, coords) {
			if (!coords) coords = this.coords(el);
			var format = (coords.width < coords.height) ? this.format[0] : this.format[1];
			$(el).attr("data-format", format);
			return format;
		},
		
		get_format: function(el) {
			var isColumns = this.el.width() > this.min_screen;
			if (!isColumns) {
				return this.format[0];
			}
			
			return $(el).attr("data-format");
		},
		
		get_data: function(el) {
			return {
				src: el.src,
				width: el.offsetWidth,
				height: el.offsetHeight
			};
		},

		// @FIXME : format_html && render are in fact the same method
		// compress thes 2 methods together
		format_html: function() {
			// Create COntainer
			this.__scroller.render();
			
			/*
				Purpose : Find the reference scale of the grid.
				Which is : the 1st portrait element
				
				1. define & save each picture format into a collection/model
				2. Find the first portrait with a method of this collection
				3. How to handle "this._clean" ???
			*/
			
			var items = this.items();
			var coords = this.collection;
			_.each(items, function(item) {
				var data = this.get_data(item);
				coords.add(data);
				
				// Find the smaller "portrait" picture
				// and keepit as a reference
				coords.sort();
				
			}.bind(this));
			
			/*
			var index0;
			var items = this.items();
			var coords0 = this.coords(items.get(0));

			items.each(function(index, el){
				var coords = this.coords(el);
				// Tag each Picture
				var format = this.set_format(el, coords);
				// Get The minimal Height
				// to define line_height
				if (format === this.format[0]) {
					if (coords0.height > coords.height) {
						index0 = index;
					}
				}
			}.bind(this));

			// Previous Test didnt Work
			if (index0 == undefined) {
				_.find(items, function(el, index) {
					var test = this.get_format(el) === this.format[0];
					if (test) index0 = index;
					return test;
				}.bind(this));
			}

			if (index0 == undefined) {
				index0 = 0;
				this._clean = false;
			}

			// Add min-coords
			var el = $(items.get(index0));
			var coords = this.coords(el);
			
			this._ref = coords;
*/
			
			// @TEST : format:end should be called once
			// @each load && resize
			$(this.el).trigger("format:end");
		},


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
		

		render: function(event, options) {
			
			if (!options) options = {};

			var items = this.items();
			items.each(function(index, el){
				var img = this.get_picture(el).get(0);
				var format = this.get_format(el);
				
				// Smaller coords
				// var coords = this._ref;
				var coords = this.collection.get(0);
				var previous;

				// Create a container
				// If el is a simple picture
				if (img === el) {
					if (format === this.format[1]) {
						// Create .bloc
						var container = $(el).prevAll("." + format).first();
						if (!container.get(0) || container.children().size() >= 2) {
							$(el).before('<div class="' + format + '">');
						}
					}	else {
						$(el).before('<div class="' + format + '">');
					}
					previous = $(el).prevAll("." + format).first();
				}
				// Add a background to container:
				// To align picture on axes: x, y
				var item = el;
				if (img) {
					var picture = this.replace_picture(img, {
						coords: coords
					});
					// Move Picture
					if (previous) {
						previous.append(picture);
						item = previous;
					}
					
					$(item).attr("data-content", "picture");
					return;
				}
				$(item).attr("data-content", "text");

			}.bind(this));

			$("[data-content]", this.el).each(function(index, el){
				var pictures = this.get_picture(el);

				// Clean LandscapeItem Size
				// case0: 2 pictures in 1 columns
				// case1: 1 pictures int 2 columns
				//
				// FIX: gérer mieux l'exception
				// lorsque ttes les image sont la même taille
				// Ne pas les regrouper
				// et donc ne pas toucher à leur taille
				//
				// @TEST : landscape cases
				// resize pictures
				if (this._clean) {
					if ($(el).hasClass(this.format[1])) {
						if (pictures.size() >= 2) {
							pictures.each(function(index, item) {
								$(item).css({
									height: $(item).height() / 2
								});
							}.bind(this));
						} else {
							// Colspan=2
							var picture = pictures.first();
							picture.css({
								width: $(el).width() * 2,
								height: $(el).height()
							});
						}
					}
				}

				// Resize Background
				pictures.each(function(index0, img) {
					var size = this.background_size(img);
					$(img).css({ "background-size": size});
				}.bind(this));

			}.bind(this));
			
			// @FIXME : Really ?
			// use an event instead
			$("body").trigger("resize");
			// if (options.success) options.success();
		},
		
		destroy: function() {
			console.log("destroy")
		}

	}
	
	window.PictureWall = PictureWall;
})()

