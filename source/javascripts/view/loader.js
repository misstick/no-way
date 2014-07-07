(function(baseView) {
	
	var NAMESPACE = "loader";

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

		is_loaded: function(el) {
			return !!el.offsetWidth;
		},

		data: function(el) {
			return {
				src: el.src,
				width: el.offsetWidth,
				height: el.offsetHeight,
				order: el._index
			};
		},

		render: function() {
			$(this.el).trigger("load:start");

			var items = $("img", this.el);

			var _complete = _.after(items.length, function() {
				this.collection.sort();
				$(this.el).trigger("load:stop");
			}.bind(this));

			var _save = function(event) {
				var el = event.target;
				var data = this.data(el);
				this.collection.add(data);
				_complete();
			}.bind(this);

			// Get real picture size
			// and launch render after that
			items.each(function(index, el){
				el._index = index;
				if (!this.is_loaded(el)) {
					el.onload = _save;
					return;
				}
				_save({target: el});

			}.bind(this));
		}
	});
	
	_VIEW[NAMESPACE]  = loaderView;

})(_VIEW["base"]);

