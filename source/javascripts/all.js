(function() {

	window.Views = {}

	//
	// View: PictureWall
	// Handle format: landscape/portrait
	// Set pictures close together
	// Save picture positions
	//


	// FIX : STocker la taille dans un cookie (ou +)
	// Stocker l'url de la page

	var PictureWall = function(el, options) {
		if (!options) options = {};
		this.el = el;
		this.items = $(options.item || "img", this.el);

		this.el.addClass("js")

		// Init
		var _func = this.resize.bind(this)
		$(window).on("resize", _.debounce(_func, 100));
		$(this.el).on("format:end", this.render.bind(this));
		this.load();
	}

	PictureWall.prototype = {

		format: ["portrait", "landscape"],

		_clean: true,

		coords: function(el) {
			return {
				width: el.get(0).offsetWidth,
				height: el.get(0).offsetHeight
			}
		},

		img: function(el) {
			var tagname = el.tagName.toLowerCase();
			if (tagname != "img") {
				el = $("img", el).get(0);
			}
			return el;
		},

		load: function() {
			var loader = _.after(this.items.length, this.format_html.bind(this))
			this.items.each(function(index, el){
				el = this.img(el);
				el.onload = loader;
			}.bind(this));
		},

		grid: function() {
			var grid = [];
			var coords = this._coords;
			this.el.children().each(function(index, el) {
				line = Math.round(el.offsetTop / coords.height);
				if (!grid[line]) grid[line] = [];
				grid[line].push(el);
			});
			return grid;
		},

		resize: function() {
			// All pictures dont have the same width
			// Remove last blank
			// Set container width the same as linewidth
			var complete = function(grid) {
				var width = 0;
				var line0 = grid.shift();
				_.each(line0, function(el) {
					width += $(el).width();
				})
				this.el.width(width);
			}.bind(this);

			var index = 0;
			var _resize = function(grid) {
				if (index >= 10|| grid.length <= 1) {
					complete(grid);
					return;
				}
				var last = _.last(grid);
				var columns = Math.ceil(this.el.width() / this._coords.width);
				if (last.length === columns) {
					complete(grid);
					return;
				}
				// Resize Container
				var width = columns * this._coords.width;
				this.el.width(width + $(last.shift()).width());
				// Remove Next Elements
				++index;
				_resize(this.grid());
			}.bind(this);

			_resize(this.grid())
		},

		set_format: function(el, coords) {
			if (!coords) coords = this.coords($(el));
			var format = (coords.width < coords.height) ? this.format[0] : this.format[1];
			$(el).attr("data-format", format);
			return format;
		},

		get_format: function(el) {
			return $(el).attr("data-format");
		},

		format_html: function() {
			var index0;
			var coords0 = this.coords(this.items.first());

			this.items.each(function(index, el){
				var coords = this.coords($(el));
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
				_.find(this.items, function(el, index) {
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
			var el = $(this.items.get(index0));
			var coords = this.coords(el);


			// var min_height = Math.round(window.innerHeight / 1.5);
			// if (coords.height < min_height) {
			// 	coords.width = Math.round(coords.width * min_height / coords.height);
			// 	coords.height = min_height;
			// }

			this._coords = coords;
			var success = function() {
				$(this.el).trigger("resize");
			}.bind(this);
			$(this.el).trigger("format:end", {success: success});
		},

		replaceImage: function(el, options) {
			if (!options) options = {};
			var style = {
				"width": options.coords.width,
				"height": options.coords.height,
				"background-repeat": "no-repeat",
				"background-position": "50% 50%",
				"background-image": "url('" + $(el).attr("src") + "')"
			};

			var coords = this.coords($(el));
			var width = Math.round(coords.width * (this._coords.height / 2) / coords.height);
			style["background-size"] = (width < this._coords.width) ? "100% auto" : "auto 100%";

			$(el.parentNode).append("<div class='image'>");
			var img = $(".image").last();
			img.css(style);
			$(el).remove()

			return img.get(0);
		},

		render: function(event, options) {
			if (!options) options = {};
			this.items.each(function(index, el){
				var img = this.img(el);
				if (img !== el) return;
				var format = this.get_format(el);
				var coords = this._coords;
				if (format === this.format[1]) {
					// Create .bloc
					var container = $(el).prevAll("." + format).first();
					if (!container.get(0) || container.children().size() >= 2) {
						$(el).before('<div class="' + format + '">');
					}
				}	else {
					$(el).before('<div class="' + format + '">');
				}
				// Move Picture
				var previous = $(el).prevAll("." + format).first();
				var el = this.replaceImage(el, {coords: coords, format: format});
				previous.append(el);

			}.bind(this));

			// Clean picture size
			if (this._clean) {
				this.el.children(".landscape").each(function(index, el) {
					var pictures = $(el).children();
					if (pictures.size() >= 2) {
						pictures.each(function(index, item) {
							$(item).css({
								height: $(item).height() / 2
							});
						}.bind(this));
						return;
					}
					// Colspan=2
					var picture = pictures.first();
					picture.css({
						width: $(el).width() * 2,
						height: $(el).height()
					});
				}.bind(this));
			}

			if (options.success) options.success();
		}

	}

	window.Views.PictureWall = PictureWall;

})()

