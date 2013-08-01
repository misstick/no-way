(function() {
	// localStorage fallback
	// for all browsers
	// source: https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Storage
	if (!window.localStorage) {
		window.localStorage = {
			getItem: function (sKey) {
				if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
				return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
			},
			key: function (nKeyId) {
				return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
			},
			setItem: function (sKey, sValue) {
				if(!sKey) { return; }
				document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
				this.length = document.cookie.match(/\=/g).length;
			},
			length: 0,
			removeItem: function (sKey) {
				if (!sKey || !this.hasOwnProperty(sKey)) { return; }
				document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
				this.length--;
			},
			hasOwnProperty: function (sKey) {
				return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
			}
		};
		window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;

	}


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
		this.pictures = $("img", this.el);

		// Init
		var _func = this.resize.bind(this)
		$(window).on("resize", _.debounce(_func, 100));
		$(this.el).on("format:end", this.render.bind(this));
		this.load();
	}

	PictureWall.prototype = {

		format: ["portrait", "landscape"],

		coords: function(el) {
			return {
				width: el.get(0).offsetWidth,
				height: el.get(0).offsetHeight
			}
		},

		load: function() {
			var loader = _.after(this.pictures.length, this.format_html.bind(this))
			this.pictures.each(function(index, el){
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
			var coords0 = this.coords(this.pictures.first());

			this.pictures.each(function(index, el){
				var _coords = this.coords($(el));
				// Tag each Picture
				var format = this.set_format(el, _coords);
				// Get The minimal Height
				// to define line_height
				if (format === this.format[0]) {
					if (coords0.height > _coords.height) {
						index0 = index;
					}
				}
			}.bind(this));

			// Previous Test didnt Work
			if (index0 == undefined) {
				_.filter(this.pictures, function(el, index) {
					var test = this.get_format(el) === this.format[0];
					if (test) index0 = index;
					return test;
				}.bind(this));
			}

			if (index0 == undefined) {
				index0 = 0;
			}

			// Add min-coords
			var el = $(this.pictures.get(index0));
			var coords = this.coords(el);

			// var min_height = Math.round(window.innerHeight / 1.5);
			// if (coords.height < min_height) {
			// 	coords.width = Math.round(coords.width * min_height / coords.height);
			// 	coords.height = min_height;
			// }

			var el = $(this.pictures.get(index0));
			this._coords = coords;
			$(this.el).trigger("format:end");
		},

		replaceImage: function(el, options) {
			if (!options) options = {};
			var style = options.coords || {};
			_.extend(style, {
				"background-repeat": "no-repeat",
				"background-position": "50% 50%",
				"background-image": "url('" + $(el).attr("src") + "')"
			});

			var coords = this.coords($(el));
			var width = Math.round(coords.width * (this._coords.height / 2) / coords.height);
			style["background-size"] = (width < this._coords.width) ? "100% auto" : "auto 100%";

			$(el.parentNode).append("<div class='image'>");
			var img = $(".image").last();
			img.css(style);
			$(el).remove()

			return img.get(0);
		},

		render: function() {
			this.pictures.each(function(index, el){
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
			this.el.children(".landscape").each(function(index, el) {
				var pictures = $(el).children();
				if (pictures.size() >= 2) {
					pictures.each(function(index, item) {
						$(item).css({
							height: $(item).height() / 2
						});
					})
					return;
				}
				// Colspan=2
				var picture = pictures.first();
				picture.css({
					width: $(el).width() * 2,
					height: $(el).height()
				});
			}.bind(this));

			$(this.el).trigger("resize");
		}
	}

	window.Views.PictureWall = PictureWall;

})()

