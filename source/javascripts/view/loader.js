(() => {
    "use strict";

    const main = window;
    const baseView = main._VIEW["base"];

	const NAMESPACE = "loader";

	var loaderView = function(el, options) {
		baseView.apply(this, arguments);
	}

	loaderView.prototype = Object.create(baseView.prototype);

	_.extend(loaderView.prototype, {

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

		data: function(el, img) {
			if (!el) {
				return false;
			}
			var content;
			var data = {
				order: el._index,
				width: el.offsetWidth,
				height: el.offsetHeight,
				content: (content = $(el).html()),
                __is_picture: false
			}
			if (img) {
				_.extend(data, {
					src: img.src,
					img_width: img.offsetWidth,
					img_height: img.offsetHeight,
					content: content.replace(/\<img [\s\w\/"'.=_-]*\/{0,1}\>/, ""),
                    __is_picture: el == img
				});
			}
			
			return data;
		},

		render: function() {
			$(this.el).trigger("load:start");
			
			var items = $(this.el).children();
			
			var _is_loaded = function(el) {
				return !!el.offsetWidth;
			}
			
			var _is_picture = function(el) {
				return el.tagName.toLowerCase() == "img";
			}
			
			var _get_picture = function(el) {
				return (!_is_picture(el)) ? $("img", el).get(0) : el;
			}
			
			var _complete = _.debounce(function() {
				this.collection.sort();
				$(this.el).trigger("load:stop");
				this.collection.off("add", _complete);
			}.bind(this), 800);
			this.collection.on("add", _complete);
						
			var _save = function(el, img) {
				var data = this.data(el, img);
				this.collection.add(data);
			}.bind(this);
			
			_.each(items, function(el, index) {
				
				el._index = index;
				
				var img = _get_picture(el);
				if (img && ! _is_loaded(img)) {
					img.onload = function(event) {
						_save(el, img);	
					};
					return;
				}
				
				_save(el, img);
				
			}.bind(this));
		}
	});
	
	main._VIEW[NAMESPACE]  = loaderView;

})();
