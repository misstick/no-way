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

		line_height: null,

		coords: function(el) {
			return {
				width: el.get(0).offsetWidth,
				height: el.get(0).offsetHeight
			}
		},

		/*
		set_grid: function() {
			this.grid = [];
			this.el.children().each(function(index, el) {
				line = Math.round(el.offsetTop / this._coords.height);
				if (!this.grid[line]) this.grid[line] = [];
				this.grid[line].push(el);
			}.bind(this));
		},
		*/

		width: function(line) {
			var last = _.last(line);
			return last.offsetLeft + last.offsetWidth;
		},

		stop: function() {
			this._index = 0;
			this.el.removeAttr("style");
		},

		nextAll: function(el, value) {
			var result = [];
			var next = $(el).next();
			var index = _.indexOf(this.el.children(), el);
			var len = this.el.children().length
			while (value > 0 && index < (len - 1)) {
				result.push(next.get(0));
				value -= next.width();
				next = next.next();
				++index;
			}
			return (!result.length) ? null : result;
		},

		load: function() {
			var loader = _.after(this.pictures.length, this.format_html.bind(this))
			this.pictures.each(function(index, el){
				el.onload = loader;
			}.bind(this));
		},

		resize: function() {
			console.log("resize ALL")
			/*
			this.stop();
			// Set the initial content to have the same result
			// when page will be re-loaded
			this.el.html(this._content);
			this.set_grid();
			*/
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
			var index_ref;
			var max = Math.ceil(window.innerHeight);
			this.pictures.each(function(index, el){
				var _coords = this.coords($(el));
				// Tag each Picture
				var format = this.set_format(el, _coords);
				// Get The minimal Height
				// to define line_height
				if (format === this.format[0]) {
					if (!this.line_height || this.line_height > _coords.height) {
						index_ref = index;
						this.line_height = _coords.height;
					}
				}
			}.bind(this));
			var el = $(this.pictures.get(index_ref));
			if (this.line_height > max) {
				this.line_height = max;
				el.width(this.line_height * el.width() / el.height())
			}
			this._coords = this.coords(el);
			$(this.el).trigger("format:end");
		},

		render: function() {
			var bloc = null;
			var className = {
				container: "bloc",
				single: "one-child"
			};
			this.pictures.each(function(index, el){
				var _coords = this.coords($(el));
				var format = this.get_format(el);
				if (format === this.format[1]) {
					var previous = $(el).prevAll("." + className.single);
					if (!previous.get(0)) previous = $(el).prev();
					if (!previous.hasClass(className.container) || previous.children().length >= 2) {
						$(el).before('<div class="' + className.container + ' ' + className.single + '"></div>');
						previous = $(el).prev();
					}
					// Resize Landscape
					var height = this.line_height / 2;
					var width = _coords.width * this.line_height / _coords.height
					if (previous.children().length) {
						width = width / 2;
						previous.removeClass(className.single);
					}
					previous.height(this._coords.height);
					previous.width(this._coords.width);

					// Move Picture
					previous.append(el);
					return;
				}

				// Resize Portait
				if (_coords.height != this._coords.height) {
					$(el).width(Math.round(_coords.width * this._coords.height / _coords.height));
					$(el).height(this._coords.height);
				}

			}.bind(this));
			this._content = this.el.html();
		}
	}

	window.Views.PictureWall = PictureWall;

})()

