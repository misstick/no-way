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

		if (options.item) this.item = options.item;

		this.el.addClass("js")

		// Init
		var _func = this.resize.bind(this)
		$(window).on("resize", _.debounce(_func, 100));
		$(this.el).on("format:end", this.render.bind(this));
		this.load();
	}

	PictureWall.prototype = {

		item: "img",

		format: ["portrait", "landscape"],

		_clean: true,

		coords: function(el) {
			return {
				width: el.get(0).offsetWidth,
				height: el.get(0).offsetHeight
			}
		},

		get_pictures: function(el) {
			if (el.get !== undefined ) el = el.get(0);
			var tagName = el.tagName.toLowerCase();
			if (tagName != "img") {
				var test = $("img", el);
				return (!test.get(0)) ? $(".image", el) : test;
			}
			return $(el);
		},

		items: function() {
			return $(this.item, this.el);
		},

		load: function() {
			var items = this.items();
			var loader = _.after(items.length, this.format_html.bind(this))
			items.each(function(index, el){
				el = this.get_pictures($(el));
				el.get(0).onload = loader;
			}.bind(this));
		},

		grid: function() {
			var grid = [];
			var coords = this._ref;
			this.el.children().each(function(index, el) {
				line = Math.round(el.offsetTop / coords.height);
				if (!grid[line]) grid[line] = [];
				grid[line].push(el);
			});
			return grid;
		},

		resize: function() {
			// Remove Previous resize
			this.el.css("width", "auto");

			// Container.width should have
			// the same value than Line.width
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
				var columns = Math.ceil(this.el.width() / this._ref.width);
				if (last.length === columns) {
					complete(grid);
					return;
				}
				// Container Width must be
				// an Integer multiple of item width
				var width = columns * this._ref.width;
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
			var items = this.items();
			var coords0 = this.coords(items.first());

			items.each(function(index, el){
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
			var success = function() {
				this.resize()
			}.bind(this);

			$(this.el).trigger("format:end", {success: success});
		},

		replace_picture: function(el, options) {
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
			if (parent.attr("data-format") !== undefined || parent.get(0) === this.el.get(0)) {
				parent.append("<div class='image'>");
				parent = $(".image").last();
			} else {
				parent.addClass("image")
			}
			parent.css(style);

			// Save initaila-size
			var coords = this.coords($(el));
			$(parent).attr("data-size", coords.width + "|" + coords.height);
			$(el).remove()
			return parent.get(0);
		},

		item_size: function (el) {
			var value = $(el).attr("data-size");
			if (value) {
				value = value.split("|");
				return {
					width: value[0],
					height: value[1]
				}
			}
			return this.coords($(el));
		},

		background_size: function(el) {
			var coords = this.item_size(el);
			var coords0 = this.coords($(el));

			if (coords.width >= coords0.width) {
				var height = Math.round(coords0.width * coords.height / coords.width);
				if (height >= coords0.height) {
					return coords0.width + "px " + height + "px";
				}
			}
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
				var img = this.get_pictures(el).get(0);
				var format = this.get_format(el);
				var coords = this._ref;
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
				var picture = this.replace_picture(img, {
					coords: coords
				});

				// Move Picture
				if (previous) {
					previous.append(picture);
					previous.attr("data-item", true);
				} else {
					$(el).attr("data-item", true);
				}

			}.bind(this));

			$("[data-item=true]", this.el).each(function(index, el){
				var pictures = this.get_pictures(el);

				// Clean LandscapeItem Size
				// case0: 2 pictures in 1 columns
				// case1: 1 pictures int 2 columns
				//
				// FIX: gérer mieux l'exception
				// lorsque ttes les image sont la même taille
				// Ne pas les regrouper
				// et donc ne pas toucher à leur taille
				//
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

			if (options.success) options.success();
		}

	}

	$(document).ready(function() {
		var gallery = [];
		$("[data-type=gallery]").each(function(index, item) {
			gallery.push(new PictureWall($(item), {
				item: $(item).attr("data-item") || "img"
			}));
		})
		window.Views.Gallery = gallery;

	})
})()

