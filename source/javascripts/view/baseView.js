(function(main) {
	main._VIEW = {};

	var view_counter = 0;
	
	var NAMESPACE = "base";
	
	var baseView = function(el, options) {
		if (el) {
			this.initialize(el, options);
		}
	};

	baseView.prototype = {

		initialize: function(el, options) {
			
			options = options || {};
			
			this.el = el;
			
			if (options.collection) {
				this.collection = options.collection;
			}
			
			this.cid = options.cid || "V" + (++view_counter);
		},

		destroy: function() {
			console.log("destroy")
		}
	};
	
	_VIEW[NAMESPACE] = baseView;
})(this);
