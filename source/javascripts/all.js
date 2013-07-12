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
		var path = ".portrait";
		this.item = {
			path: path,
			coords: this.coords($(path, this.el).first())
		};
		this.className = {
			container: "bloc",
			single: "one-child"
		};

		// Init
		this.cleanMarkup();
		var _func = this.render.bind(this);
		$(window).on("resize", _.debounce(_func, 100));
	}

	PictureWall.prototype = {

		coords: function(el) {
			return {
				width: el.get(0).offsetWidth,
				height: el.get(0).offsetHeight
			}
		},

		set_grid: function() {
			this.el.children().each(function(index, el) {
				line = Math.round(el.offsetTop / this.item.coords.height);
				if (!this.grid[line]) this.grid[line] = [];
				this.grid[line].push(el);
			}.bind(this));
		},

		line_width: function(line) {
			var last = _.last(line)
			return last.offsetLeft + last.offsetWidth;
		},

		stop: function() {
			this._index = 0;
			this.grid = [];
			this.el.removeAttr("style");
		},

		render: function() {
			this.stop();
			this.set_grid();
			
			var blank_min = Math.ceil(this.item.coords.width / 3);
			var coords = this.coords(this.el);
			while(this._index < this.grid.length - 1) {
				var line = this.grid[this._index];
				var width = this.line_width(line);
			
				// Do not move if space is too short
				var blank = Math.ceil(coords.width - width);
				// console.log(line, blank, blank_min)
				if (blank >= blank_min) {
					var el = _.last(line);
					var next = $(el).nextAll(this.item.path).get(0);
					if (next) {
						// Move into DOM & array
						$(el).after(next);
			
						// Update Parent Size
						// pour la réexploiterr
						var size = $(next).width() + width;
						if (size > coords.width) this.el.width(size);
			
						// Update Context
						this.set_grid();
					}
				}
				// Goto Next Line
				++this._index;
			}
		},

		// resize: function() {
		// 	var max = 0;
		// 	_.each(this.grid, function(line, index) {
		// 		var width = this.line_width(line)
		// 		if (!max || max < width) max = width;
		// 	})
		// 	this.el.width(max)
		// },

		cleanMarkup: function() {
			var bloc = null;
			var line_height = this.item.coords.height;
			$("img", this.el).each(function(index, el){
				var _coords = this.coords($(el));
				if ($(el).hasClass("landscape")) {
					var previous = $(el).prev();
					if (!previous.hasClass(this.className.container) || previous.children().length >= 2) {
						$(el).before('<div class="' + this.className.container + ' ' + this.className.single + '"></div>');
						previous = $(el).prev();
					}
					// Resize Pictures
					var height = line_height / 2;
					var width = _coords.width * line_height / _coords.height
					if (previous.children().length) {
						width = width / 2;
						previous.removeClass(this.className.single);
					}
					previous.height(line_height);
					previous.width(width);

					// Move Picture
					previous.append(el);
				}
			}.bind(this));
		}
	}

	window.Views.PictureWall = PictureWall;

})()

