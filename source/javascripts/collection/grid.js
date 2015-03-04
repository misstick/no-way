(function(baseCollection) {

	var NAMESPACE = "grid";

	var GridCollection = function(data) {
		baseCollection.apply(this, arguments);
	}
	
	GridCollection.prototype = Object.create(baseCollection.prototype);
	
	_.extend(GridCollection.prototype, {
		
		defaults: {
			order: 0,
			src: null,
			width: 0,
			height: 0,
			format: "portrait"
		},
		
		validate: function(data, options) {
            // Use "landscape" format only when the DOM is only a picture
			data.format = (data.width > data.height && this.is_picture(data)) ? "landscape" : "portrait";
			data.type = (!data.src) ? "text": "picture";
			return data;
		},
		
		sort_by_format: function(callback) {
			var models = _.clone(this.models);
			var callback = callback || function(data) { return data; };
			return _.map(models, function(model, index, list) {
				if (model.format != "portrait") {
					
					var _list = list.slice(index + 1, list.length);
					var next = _.findWhere(_list, {format: "landscape"});
					if (next) {
						list.splice(_.indexOf(list, next), 1);
						return callback([model, next]);
					}
					return callback([model]);
				}
				return callback(model);
			});
		},
        
        is_picture: function(data) {
            return data.__is_picture || false;
        },
		
		get_item_size: function(screen_coords) {
			var width = 0;
			var height = 0;
			var height_max = Math.ceil(screen_coords.height / 1.5);
			var model0 = null;
			
			// Get Smaller Item into the grid
			_.each(this.models, function(model) {
				if (!model0 && model.format == "portrait") {
					model0 = model;
				}
				var _height = (model.format == "portrait") ? model.height : model.height * 2;
				if(!height) {
					height = _height;
					return;
				}
				if (_height < height) {
					height = _height;
				}
			});
			
			// It should have several rows
			// in one page
			if (height > height_max) {
				height = height_max;
			}
			
			return {
				width: Math.ceil(model0.width * height / model0.height),
				height: height
			}
		}
	});

	_COLLECTION[NAMESPACE]  = GridCollection;
})(_COLLECTION["base"]);
