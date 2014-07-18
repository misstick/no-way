(function() {
	
	
	$(document).on("ready", function() {
	
		// Create PinIt Button
		var pintit = false;
		var _pintit_display = function() {
			if (pintit) return;
			pintit = true;
			var create_link = function(data) {
				if (!data.text) data.text = $("title").html()
				data.text +=  ", www.no-way.fr";
				return '<a href="//pinterest.com/pin/create/button/?url=' + encodeURIComponent(data.url) + '&media=' + encodeURIComponent("http://www.no-way.fr/" + data.img) + '&description=' + encodeURIComponent(data.text) + '" target="_blank"><img src="//assets.pinterest.com/images/pidgets/pin_it_button.png" /></a>'
			}
			$(".image").each(function(index, item) {
				$(item).append(create_link({
					url: document.location.href,
					img: $(item).data("src"),
					text: $(item).data("title")
				}));
			});
		}
	
		// Home Links
		var _links_display = function() {
			var goto_article = function(event) {
				var el = event.currentTarget;
				window.location = $(el).data("href");
			}
			$("[data-type=gallery] .image").each(function(index, item) {
				console.log(item, index)
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
				_pintit_display();
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