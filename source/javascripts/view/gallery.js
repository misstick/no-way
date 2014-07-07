(function(baseView, navView, loaderView, scrollerView, baseCollection, gridCollection) {
	
	var NAMESPACE = "wall";

	//
	// Handle format: landscape/portrait
	// Set pictures close together
	// Save picture positions
	//

	var wallView = function(el, options) {
		baseView.apply(this, arguments);
	}

	wallView.prototype = Object.create(baseView.prototype);

	_.extend(wallView.prototype, {
		
		collection: new gridCollection(),
		
		initialize: function(el, options) {
			
			baseView.prototype.initialize.apply(this, arguments);
			
			this._fill = this.el.data("fill") || "width";
			
			$(this.el).on("load:stop", this.render.bind(this));
			
			// @FIXME : put this in the future into render
			// when all methods will be cleanedup && renamed
			
			this.__nav = new navView(this.el);
			this.__nav.render();
			
			this.__loader = new loaderView(this.el, {
				collection: this.collection
			});
			this.__loader.render();
			
			this.__scroller = new scrollerView(this.el, {
				collection: this.collection
			});
		},
		
		render: function(event, options) {
			
			var _grid = [];
			
			var _all_content = '';
			
			var _success = _.debounce(function(data) {
				this.__scroller.grid = _grid;
				this.__scroller.render.call(this.__scroller, _all_content)
			}.bind(this), 200);
			
			var _render = function(data) {
				// it depends of screen size
				// 1 screen height == 2.5 rows
				var content = '';
				var model0 = data;
				var template0 = '<div data-content="<%= type %>">';
				var template1 = '<div class="image <%= format %>" data-cid="<%= cid %>" style="background-image: url(\'<%= src %>\');"></div>';
				var template2 = '</div>';
				
				if (_.isArray(data)) {
					model0 = data[0];
					_.each(data, function(model) {
						content += _.template(template1, model);
					});
				} else {
					content = _.template(template1, model0);
				}
				_all_content += _.template(template0, model0) + content + _.template(template2, model0);
				
				// Save Grid
				var cid = _.isArray(data) ? _.pluck(data, "cid") : [data.cid];
				_grid.push(cid);
				
				// Change Grid size
				_success();

			}.bind(this);
				
			// Transform data into DOM
			this.collection.sort_by_format(_render);
		}

	});
	
	_VIEW[NAMESPACE]  = wallView;

})(_VIEW["base"], _VIEW["nav"], _VIEW["loader"], _VIEW["scroller"], _COLLECTION["base"], _COLLECTION["grid"]);

