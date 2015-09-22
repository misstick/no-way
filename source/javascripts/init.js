(function() {
    "use strict";
	
	$(document).on("ready", function() {
	
		// Home Links
		var _links_display = function() {
			var goto_article = function(event) {
				var el = event.currentTarget;
				window.location = $(el).data("href");
			}
			$("[data-type=gallery] .image").each(function(index, item) {
				var link = $("a", item.parentNode);
				if (!link.get(0)) return;
	
				item = $(item);
				item.addClass("clickable");
				item.data("href", link.attr("href"));
				item.on("click", goto_article)
	
			})
		}
	
		// Gallery
		var create_link = function(el) {
			if (el.tagName.toLowerCase() !== "A") {
				var url = $("h2 a", el.parentNode).first().attr("href");
				$(el.parentNode).append("<a href='" + url + "' class='" + el.className + "'>");
	
				// Remove linked Children
				$("a", el).each(function(index, item) {
					var text = $(item).html();
					$(item).after(text);
					item.remove();
				})
	
				// Create Link Element
				var link = $("a.content", el.parentNode);
				link.html($(el).html());
				$(el).remove();
			}
		}
		var _ellipsis = function() {
			$("[data-content=text] .content", this.el).each(function(index, item) {
				var className = "ellipsis";
				var test = (item.scrollHeight > item.offsetHeight);
				$(item)[test ? "addClass" : "removeClass"](className);
				
				// @TODO : add a height to .content not to crop a text in half height line
	
				// Transform shortDescription as a link
				create_link(item);
			})
		};
		
		$("[data-type=gallery]").each(function(index, item) {
			// Create Gallery
			var view = new _VIEW["wall"]($(item));
			view.on("render:finished", function() {
				_links_display.call(this);
				_ellipsis.call(this);
			}.bind(this));
		});
	
		// Contact
		var email =  $("footer .email");
		if (email.get(0)) {
			var parent = email.get(0).parentNode;
			var value = email.html();
			email.remove();
			$(parent).html('<a href="mailto:' + value.replace("[AT]", "@").replace("[DOT]", ".") + '">' + $(parent).html() + '</a>')
		}
	
	});
})()