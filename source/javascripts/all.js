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
		
		this._fill = this.el.data("fill") || "width";

		// Init
		var _func = this.resize.bind(this)
		$(window).on("resize", _.debounce(_func, 100));
		$(this.el).on("format:end", this.render.bind(this));
		this.load();
	}

	PictureWall.prototype = {

		item: "img",

		min_width: "730", // Mobile Resolution

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
			return this.el.children();
		},

		load: function() {
			var loaded = false;
			var items = this.items();
			var complete = function() {
				if (this.is_mobile() || loaded) {
					$(this.el).removeClass("load");
					return;
				}
				loaded = true;
				this.format_html();
				$(this.el).removeClass("load");
			}.bind(this);
			var loader = _.after(items.length, complete);

			// Listen to picture.load
			this.el.addClass("load");
			items.each(function(index, el){
				el = this.get_pictures($(el));
				if (el.get(0)) el.get(0).onload = loader;
			}.bind(this));

			setTimeout(function() {
				if (!loaded) complete();
			}.bind(this), 1000);
		},

		is_mobile: function() {
			return window.innerWidth <= this.min_width;
		},

		resize: function() {
			if (this.is_mobile()) return;

			// Remove Previous resize
			this.el.css("width", "auto");
			
			// Get Column Value
			var items = this.items();
			var width_max = 0;
			items.each(function(index, item) {
				width_max += $(item).width();
			});
			var len = width_max / this._ref.width;
			var column = Math.ceil(this.el.width() / this._ref.width);
			while((len / column) > 1 && len % column > 0) {
				++column;
			}
			
			// Resize Content
			var width = column * this._ref.width;
			if (width > width_max) width = width_max;
			this.el.width(width);
			
			
			if (this._fill === "height") {
				var height_min = window.innerHeight;
				var height = Math.ceil(len / column) * this._ref.height;
				this.el.css({
					"padding": Math.ceil((height_min - height) / 2) + "px 0"
				});
			}
			
			$(this.el).trigger("gallery:resize");
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
			parent.data("src", $(el).attr("src"))

			// Save initaila-size
			var coords = this.coords($(el));
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
			return this.coords($(el));
		},

		background_size: function(el) {
			var coords = this.item_size(el);
			var coords0 = this.coords($(el));

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
		//
		// PINTEREST
		//
		var pintit = false;
		var pintit_display = function() {
			if (pintit) return;
			pintit = true;
			var create_link = function(data) {
				if (!data.text) data.text = $("title").html()
				data.text +=  ", www.no-way.fr";
				return '<a href="//pinterest.com/pin/create/button/?url=' + encodeURIComponent(data.url) + '&media=' + encodeURIComponent(data.img) + '&description=' + encodeURIComponent(data.text) + '" target="_blank"><img src="//assets.pinterest.com/images/pidgets/pin_it_button.png" /></a>'
			}
			
			// Create PinIt Button
			$(".image").each(function(index, item) {
				$(item).append(create_link({
					url: document.location.href,
					img: $(item).data("src"),
					text: $(item).data("title")
				}));
			});
		}
		//
		// GALLERY
		//
		$("[data-type=gallery]").each(function(index, item) {
			// Create Gallery
			var view = new PictureWall($(item));
			$(item).data("Gallery", view);
			$(item).on("gallery:resize", pintit_display);
		});
		
		//
		// Home Links
		//
		var goto_article = function(event) {
			var el = event.currentTarget;
			window.location = $(el).data("href")
			
		}
		$("#blog-content h2 a").each(function(index, item) {
			var parent = $(item).parents(".list-item").first();
			parent.addClass("clickable");
			parent.data("href", $(item).attr("href"));
			parent.on("click", goto_article)
			
		})
	});
})()

