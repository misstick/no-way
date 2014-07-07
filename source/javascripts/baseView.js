(function(main) {
	main._VIEW = {};
	
	var NAMESPACE = "base";
	
	var baseView = function(el, options) {
			this.el = el;
			options = options || {};
			if (options.cid) {
				this.cid = options.cid;
			}
			if (el) {
				this.initialize(el, options);
			}
	};

	baseView.prototype = {

			initialize: function(el, options) {
				this.el = el;

				options = options || {};
				if (options.collection) {
					this.collection = options.collection;
				}
			},

			destroy: function() {
				console.log("destroy")
			}
	};
	
	_VIEW[NAMESPACE] = baseView;
})(this);
