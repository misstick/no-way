{expect, assert} = chai

describe "Views", ->

	describe "Base", ->

		it "should return if 'el' is active", ->
			base = new Base()
			el = $("<span>")
			base.active el, true
			assert.ok base.is_active(el)
			base.active el, false
			assert.ok not base.is_active(el)

		it "should test if 'el' is disabled", ->
			base = new Base()
			el = $("<span>")
			assert.ok base.disable(el)
			assert.ok base.disable(el, true)
			assert.ok not base.disable(el, false)

		it "should test if 'el' is hidden", ->
			base = new Base()
			el = $("<span>")
			assert.ok base.hide(el)
			assert.ok base.hide(el, true)
			assert.ok not base.hide(el, false)

	describe "Menu", ->

		it "should select an item and reset the old one", ->
			menu = createMenu()
			menu.select
				currentTarget: (old = $("#item0", menu.el))
			menu.select
				currentTarget: (el = $("#item1", menu.el))
			assert.ok menu.is_active el
			assert.ok not menu.is_active old
			removeView menu

		it "should show/hide Menu", ->
			menu = createMenu()
			assert.ok menu.open()
			assert.ok not menu.open()
			assert.ok menu.open()
			removeView menu

		it "should test if 'el' belongs to Menu", ->
			menu = createMenu()
			output0 = menu.inner
				target: $('<span id="outside">')
			output1 = menu.inner
				target: $('#item1', menu.el)
			assert.ok output1
			assert.ok not output0
			removeView menu

		it "should test if menu.close() disable menu", ->
			# Test without content
			menu = createMenu
				page: true
			menu.open()
			assert.ok menu.is_active()
			menu.close()
			assert.ok not menu.is_active()

			# Trigger Click elsewhere
			menu.open()
			$(menu.page.el).trigger "click"
			assert.ok not menu.is_active()
			removeView menu

			# Test with label + content
			menu = createMenu
				content: true
				page: true
			menu.open()
			assert.ok menu.is_active()
			assert.ok menu.is_active menu.content
			menu.close()
			assert.ok not menu.is_active()
			assert.ok not menu.is_active menu.content

			menu.open()
			$(menu.page.el).trigger "click"
			assert.ok not menu.is_active()
			assert.ok not menu.is_active menu.content
			removeView menu

		it "test next()", (done) ->
			menu = createMenu
				content: true
			$(menu.content).on "scroll:end", (args...) ->
				assert.equal menu.content.scrollLeft, menu.content.offsetWidth
				removeView menu
				done()
			menu.next null, {duration: 0}

		it "test previous()", (done) ->
			menu = createMenu
				content: true
			$(menu.content).on "scroll:end", (args...) ->
				assert.equal menu.content.scrollLeft, 0
				removeView menu
				done()
			menu.previous null, {duration: 0}


	describe "PeriodSelectMenu", ->

		# FIX: test GridPage: vérifier qu'au select, on scroll bien dans la grille
		it "select model into collection", (done) ->
			menu = createMenu
				view: PeriodSelectMenu
				collection: createPeriods()
			menu.collection.on "select", (model, options) =>
				removeView menu
				done()
			item = $("[data-type=menu-item]", menu.el)
			$(item.get(0)).trigger "click"

		it "Change Label", (done) ->
			menu = createMenu
				view: PeriodSelectMenu
				collection: createPeriods()
			period = menu.collection.at(0)
			menu.collection.on "change:index", (model) =>
				assert.equal model.get("slug"), period.get("slug")
				removeView menu
				done()
			menu.collection.trigger "update",
				time: period.start() + period.duration() / 2

	describe "Loader", ->

		it "test events: Load:start & load:end", ->
			page = createPage()
			page.coords = new Coords()
			page.coords.set {x: [0, 1, 2], y: [0]}

			loader = new Loader
				delay: 0
				page: page
				collection: (collection = new Collection())

			collection.on "load:start", (_start = sinon.spy())
			collection.on "load:end", (_end = sinon.spy())

			# Load:end must be called just once
			timer = sinon.useFakeTimers()
			collection.trigger "load:start", {data: [0, 1, 2, 3]}
			assert.equal _start.callCount, 1
			collection.trigger "load:stop"
			collection.trigger "load:stop"
			timer.tick 1000
			assert.equal _end.callCount, 0
			collection.trigger "load:stop"
			collection.trigger "load:stop"
			timer.tick 1000
			assert.equal _end.calledOnce, true

			timer.restore()
			removeView page

	describe "Scroller", ->

		it "test 'scrollX' event ", (done) ->
			scroller = createScroller()
			scroller.on "scrollX", (args...) ->
				removeView scroller
				done()
			scroller.scroll 100

		it "test on 'scrollY' event ", (done) ->
			scroller = createScroller()
			scroller.on "scrollY", (args...) ->
				removeView scroller
				done()
			$(scroller._window).trigger "scroll"

		it "test 'resize' event ", (done) ->
			scroller = createScroller()
			scroller.on "resize", ->
				removeView scroller
				done()
			$(scroller._window).trigger "resize"


	describe "ProgramsScroller", ->

		it "ScrollX:event should show Programs", (done) ->
			scroller = createScroller
				view: ProgramsScroller
			scroller.collection.on "show:program", (_show = sinon.spy())
			scroller.collection.on "load", (_load = sinon.spy())

			success = (model) =>
				# Les coordonées sont valides
				assert.ok _.isNumber model.get("top")[0]
				assert.ok _.isString model.get("left")[0]
				# le chargement est lancé
				assert.ok _load.calledOnce
				# Les programmes sont affichés
				assert.ok _show.callCount > 0
				assert.equal scroller.collection.size(), _show.callCount

				scroller.coords.off "change"
				scroller.collection.off "show:program"
				removeView scroller
				done()

			scroller.coords.on "change", success
			scroller.scroll Math.ceil(scroller.el.scrollWidth / 4),
				duration: 0

		it "ScrollY should show Programs", (done) ->
			scroller = createScroller
				view: ProgramsScroller

			scroller.collection.on "show:program", (_show = sinon.spy())
			scroller.collection.on "load", (_load = sinon.spy())
			counter = 0

			success = =>
				# Les coordonées sont valides
				assert.ok _.isNumber (model = scroller.coords).get("top")[0]
				assert.ok _.isString model.get("left")[0]

				# le chargement est lancé
				assert.ok _load.calledOnce

				# Les programmes sont affichés
				assert.ok _show.callCount > 0
				assert.equal counter, _show.callCount

				removeView scroller
				done()

			scroller.collection.on "show:program", _.debounce success, 100
			scroller.coords.on "change", (model) ->
				counter = model.get("left").length * model.get("top").length
			scroller.scroll Math.ceil(scroller.el.scrollWidth / 4),
				duration: 0

	describe "FixedView", ->

		it "Add freeze Layout", (done) ->
			fixed = createFixed()
			coords = _($("#menu", fixed._window.document)).offset()
			fixed.coords.on "change:top", (model) ->
				assert.ok fixed.is_frozen()
				fixed.coords.off "change:top"
				removeView fixed
				done()
			fixed._window.scrollTo 0, coords.top + 100

		it "Reset freeze layout", (done) ->
			fixed = createFixed()
			coords = _($("#menu", fixed._window.document)).offset()
			counter = 0
			success = (model) ->
				if counter++ is 1
					assert.ok not fixed.is_frozen()
					removeView fixed
					done()
				fixed._window.scrollTo 0, 0

			fixed.coords.on "change:top", success
			fixed._window.scrollTo 0, coords.top + 100

	describe "GridFixedView", ->

		it "ScrollLeft: Re-position Page.header", (done) ->
			fixed = createFixed
				view: GridFixedView

			success = (model) ->
				left = fixed.coords.get("left")
				assert.ok fixed.header.css("left"), "#{left}px"
				fixed.coords.off "change"
				removeView fixed.page
				removeView fixed
				done()

			fixed.coords.on "change", success
			fixed.coords.set
				left: 25

		it "Scroll: update Breadcrumb.width", (done) ->
			fixed = createFixed
				view: GridFixedView

			success = (model) ->
				right = fixed.coords.get("right")
				assert.ok $("#breadcrumb",  fixed._window.document).css("width"), "#{right}px"
				fixed.coords.off "change"
				removeView fixed.page
				removeView fixed
				done()

			fixed.coords.on "change", success
			fixed._window.scrollTo 0, 100

		it "Scroll: update page.coords", (done) ->
			fixed = createFixed
				view: GridFixedView

			success = (model) ->
				assert.ok _change.calledOnce
				fixed.page.coords.off "change"
				fixed.coords.on "change"
				removeView fixed.page
				removeView fixed
				done()

			fixed.page.coords.on "change", (_change = sinon.spy())
			fixed.coords.on "change", success
			fixed._window.scrollTo 0, 100


	describe "ToolTip", ->

		it "get label.coords", ->
			tooltip = createTooltip()
			label = $(".schedule-item-short", tooltip.el).get(0)
			expect(coords = tooltip.get_coords label).to.be.a("object")
			removeView tooltip
			removeView tooltip.page

		it "mouseover:event should display '@show()'", ->
			tooltip = createTooltip()
			label = $(".schedule-item-short", tooltip.el)
			label.trigger "mouseover",
				pageX: 100
				pageY: 200
			assert.equal tooltip.label, label.get(0)
			removeView tooltip
			removeView tooltip.page

		it "mouseout:event should display '@hide()'", ->
			tooltip = createTooltip()
			label = $(".schedule-item-short", tooltip.el)
			label.trigger "mouseover",
				pageX: 100
				pageY: 200
			label.trigger "mouseout"
			assert.equal tooltip.label, undefined
			removeView tooltip
			removeView tooltip.page

		it "scroll:event should disable view", (done) ->
			tooltip = createTooltip()
			assert.equal tooltip.disabled, false
			tooltip.scroll 200,
				el: tooltip.el
			$(tooltip.el).on "scroll", ->
				assert.equal tooltip.disabled, true
				removeView tooltip
				removeView tooltip.page
				done()

		it "scrollend:event should enable view", (done) ->
			tooltip = createTooltip()
			assert.equal tooltip.disabled, false
			tooltip.scroll 200,
				el: tooltip.el
			test = ->
				assert.equal tooltip.disabled, false
				removeView tooltip
				removeView tooltip.page
				done()
			$(tooltip.el).on "scroll", _.debounce test, 500


	describe "GridMarker", ->

		it "update position:left when date.time() change", ->
			marker = createMarker()
			marker.model.set
				left: (value = marker.page.el.scrollWidth / 2)
			assert.equal "#{value}px", $(marker.el).css("left")
			removeView marker.page
			removeView marker

		it "should be removed if marker is ouf of the element", ->
			marker = createMarker()
			marker.model.on "destroy", (_destroy = sinon.spy())
			marker.model.set
				left: (value = marker.page.el.scrollWidth * 2)
			assert.equal _destroy.callCount, 1
			removeView marker.page
			removeView marker


	describe "Calendar", ->

		it "AutoScroll when opening Calendar", (done) ->
			page = createCalendar()
			page.render()
			calendar = page.menu.calendar
			calendar.model.on "change", (model) ->
				# Show CurrentMonth
				content = calendar.content
				month_el = calendar.weeks.el
				assert.ok month_el.offsetLeft, content.scrollLeft
				# Show CurrentDay
				data = calendar.model.data()
				day_el = calendar.day_el data
				month_content = calendar.weeks.content
				assert.ok day_el.offsetLeft, month_content.scrollLeft
				removeView page
				done()
			calendar.open()

		it "Select first day", (done) ->
			page = createCalendar()
			page.render()
			(calendar = page.menu.calendar).open()
			calendar.model.on "change", (model) ->
				items = calendar.visible()
				assert.ok calendar.weeks.is_start()
				assert.ok calendar.is_start(items)
				removeView page
				done()
			calendar.select_date
				date: calendar.items().first().data("date")

		it "Select last day", (done) ->
			page = createCalendar()
			page.render()
			(calendar = page.menu.calendar).open()
			calendar.model.on "change", (model) ->
				items = calendar.visible()
				assert.ok calendar.weeks.is_last()
				assert.ok calendar.is_last(items)
				removeView page
				done()
			calendar.select_date
				date: calendar.items().last().data("date")

		describe "GridPage", ->

			it "BreadCrumb selection should trigger scroll into Timeline", (done) ->
				grid = createGridPage()
				model = grid.collection.periods.at(2)
				data = grid.timeline.data {time: model.start()}
				$(grid.content).on "scroll:end", =>
					assert.equal data.left, grid.content.scrollLeft
					removeView grid
					done()
				grid.collection.periods.trigger "select", model,
					duration: 0

			it "Marker is initialized should trigger scroll into Timeline", (done) ->
				grid = createGridPage
					marker: true
				success = ->
					assert.equal grid.marker.scroll_value(), grid.content.scrollLeft
					grid.timeline.off "scrollX"
					removeView grid
					done()
				grid.timeline.on "scrollX", _.debounce success, 102
				grid.marker.animate()

			it "Marker.animate() should update its label each minutes", (done) ->
				grid = createGridPage
					marker: true
				$(grid.content).on "scroll:end", (_scroll = sinon.spy())
				grid.marker.model.on "change:left", (_change = sinon.spy())
				counter = 2
				@timeout 60 * (counter + 0.5) * 1000
				setTimeout ->
						assert.ok _scroll.calledOnce
						assert.ok _change.callCount >= counter
						removeView grid
						done()
					, 60 * counter * 1000
				grid.marker.animate()


# Add Test for: Tabs
