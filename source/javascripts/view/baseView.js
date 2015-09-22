(() => {
    "use strict";

    const main = window;
	const NAMESPACE = "base";

	let view_counter = 0;

	
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
		
		on: function(name, func) {
			$(window).on(this.cid + "::" + name, func);
		},
		
		off: function(name, func) {
			$(window).off(this.cid + "::" + name, func || null);
		},
		
		trigger: function(name, data) {
			$(window).trigger(this.cid + "::" + name, data);
		},

		destroy: function() {
			console.log("destroy")
		}
	};

	main._VIEW = {};	
	main._VIEW[NAMESPACE] = baseView;
})();
