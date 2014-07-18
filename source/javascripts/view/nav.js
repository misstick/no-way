(function(baseView) {

	_.mixin({
		create_affix: function(el) {
			var coords = el.offset();
			if (!coords.top) el.addClass("affix");
			else el.affix({ offset: coords});
		}
	});

	var NAMESPACE = "nav";

	var navView = function(el, options) {
		baseView.apply(this, arguments);
	}

	navView.prototype = Object.create(baseView.prototype);

	_.extend(navView.prototype, {
		
		template: '<nav data-view="scroll_nav"><button data-action="back"><button data-action="next"></nav>',

		// @TEST : Navigation bar should exist
		// on nonetouch resolutions
		render: function() {
			var path_content = '[data-view="scroll_nav"]';
			if (!$(path_content, this.el).get(0)) {
				// Add navigation
				this.el.append(this.template);
				_.create_affix($("nav", this.el));
				
				// Handle Click Event
				$(path_content + ' button', this.el).on("click", this.goto.bind(this));
				
				// Handle Scroll Event
				$(this.el).on("scroll", _.throttle(this.render.bind(this), 100));
			}
			
			// Show / Hide buttons
			var data = this.get_data(this.el.get(0));
			$("[data-action=next]")[(data.scrollLeft === data.right) ? "addClass" : "removeClass"]("disabled");
			$("[data-action=back]")[(data.scrollLeft === data.left) ? "addClass" : "removeClass"]("disabled");
		},
		
		get_data: function(el) {
			return {
				left: 0, 
				right: el.scrollWidth - el.offsetWidth,
				scrollLeft: el.scrollLeft
			}
		},
		
		goto: function(event) {
			var target = event.currentTarget;
			var action = $(target).data("action");
			var step = this.el.width() / 2;
			var value = (action === "next") ? this.el.get(0).scrollLeft + step : this.el.get(0).scrollLeft - step;
			
			// ANimation
			this.el.animate({ "scrollLeft": value}, { complete: display_buttons});
		},
	});

	_VIEW[NAMESPACE]  = navView;

})(_VIEW["base"]);

