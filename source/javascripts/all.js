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

			var index = 0;
			var _resize = function(grid) {
				if (index >= grid.length || grid.length <= 1) {
					return;
				}

				var last = _.last(grid);
				var columns = Math.ceil(this.el.width() / this._coords.width);
				if (last.length === columns) {
					return;
				}

				// Resize Container
				var width = columns * this._coords.width;
				this.el.width(width + $(last.shift()).width());
				console.log(index)
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

		path_referer: function() {
			return "[data-format=" + this.format[0] + "]"
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
			var el = $(this.pictures.get(index0));
			this._coords = this.coords(el);
			$(this.el).trigger("format:end");
		},

		render: function() {

			this.pictures.each(function(index, el){
				var _coords = this.coords($(el));
				if (_.isEqual(this._coords, _coords)) {
					return;
				}
				var format = this.get_format(el);
				var coords = this._coords;
				var previous;
				if (format === this.format[1]) {
					// Change width,
					// if picture isnt larger enought
					var width = Math.round(_coords.width * (this._coords.height / 2) / _coords.height);
					if (width < this._coords.width) coords.width = width;
					// Create .bloc
					previous = $(el).prevAll("[data-rows=2]").first();
					if (!previous.get(0) || $("img", previous).size() >= 2) {
						$(el).before('<div data-rows="2">');
						previous = $(el).prev();
					}
				}	else {
					$(el).before('<div>');
					previous = $(el).prev();
				}
				// Move Picture
				previous.append(el);
				previous.css(coords);

			}.bind(this));

			// Multi-Rows if a container isnt filled
			this.el.children("[data-rows=2]").each(function(index, el) {
				if ($(el).children().size() >= 2) return;
				$(el).attr("data-rows", "1");
				$(el).attr("data-columns", "2");
				var width = $(el).width();
				$(el).width(width * 2);
			}.bind(this));

			$(this.el).trigger("resize");
		}
	}

	window.Views.PictureWall = PictureWall;

})()

