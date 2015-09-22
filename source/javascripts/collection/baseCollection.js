(() => {
    "use strict";

    const main = window;
	const NAMESPACE = "base";

	let view_counter = 0;

	var BaseCollection = function(data) {
		this.initialize(data || null);
	}
	
	BaseCollection.prototype = {
		
		defaults: {
			order: 0
		},
		
		models: [],
		
		initialize: function(data) {
			if (data) {
				this.add(data);
			}
			this.cid = "C" + (++view_counter);
		},
		
		add: function(data, options) {
			var options = options || {};
			if (!data && data !== undefined) {
				return;
			}
			if (_.isArray(data)) {
				_.each(data, function(model) {
					this.add(model);
				}.bind(this));
				return;
			}
			
			var attributes = _.clone(this.defaults);
			_.extend(attributes, data);
			attributes = this.validate(attributes, options);
			if (attributes) {
				attributes.cid = this.cid + this.models.length;
				this.models.push(attributes);
				this.trigger("add", attributes);
			}
		},
		
		validate: function(data, options) {
			return data;
		},
		
		sort: function() {
			this.models = _.sortBy(this.models, function(model) {
				return model.order;
			});
		},
				
		get: function(index) {
			return this.models[index];
		},
        
        size: function() {
            return this.models.length;
        },
		
		reset: function() {
			this.models = []
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
		
		remove: function() {
			this.reset();
			this.off("add");
			delete this;
		}
	};

	main._COLLECTION = {};
	main._COLLECTION[NAMESPACE]  = BaseCollection;
})();
