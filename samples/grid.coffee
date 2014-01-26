class ToolTip extends Base

  disabled: false

  events:
	"mousemove .schedule-item-short": "show"
	"mouseover .schedule-item-short": "show"
	"mouseout .schedule-item-short": "hide"

  constructor: (options) ->
	super options
	# FIX: utiliser le sméthodes native de Backbone pour ça
	content = "#tooltip-manager"
	@_window = _.window()
	_document = @_window.document
	$("body", _document).append "<div id=tooltip-manager class=schedule-item-pop>" unless $(content, _document).get(0)
	(@content = $(content, _document)).on "mouseout", @hide
	# Hide tooltip when content is scrolling
	_.each (scroll_elements = [@_window, @el]), (el) =>
	  $(el).on "scroll", @disable
	  $(el).on "scroll", _.debounce @enable, 500

  get_coords: (el) =>
	return unless el
	width = 300
	margin = 20
	min = @coords.get("left")
	max = @coords.get("right")
	coords = _(el).offset()
	coords.top -= _(@_window).scrollY()

	# Content Size
	coords.left += (left = -13)
	coords.left = min + margin if coords.left < (min + margin)
	if (step = max - (coords.left + width + margin)) < 0
	  coords.arrow = step * -1
	  coords.left += step
	coords.right = coords.left + width
	coords

  show: (event, coords) =>
	return if @disabled
	_.extend event, coords if coords
	cursor =
	  left: (left = _(@_window).screenX(event)) - 40
	  right: left + 40
	@create event if @coords.inner cursor


  disable: (value) =>
	return if value and @disabled
	value = true if value is undefined or _.isObject(value)
	@disabled = value
	@hide() if value

  enable: =>
	@disable false

  create: (event) =>
	return if (el = event.currentTarget) is @label
	return unless (coords = @get_coords el)

	# Position
	@content.css
	  left: coords.left
	  top: coords.top

	# Add Content
	@content.html("")
	text = $(el).clone()
	text.removeClass "schedule-item-past"
	text.css
	  width: "100%"
	  left: "auto"

	#Create Arrow
	unless (arrow = $(".arrow", @content)).get(0)
	  arrow = $("<span class=arrow>")
	  @content.append arrow
	arrow.css
	  left: coords.arrow
	@content.append text

	# Show
	@active @content, true
	@label = el

  hover: (event, label) =>
	# FIX: ne gère pas le survol
	 # au dessus de la colonne des chaines
	return if not event or not label
	cursor =
	  left: _(@_window).screenX(event)
	  top: _(@_window).screenY(event)
	coords = _(label).offset()
	coords.top -= (scrollY = _(@_window).scrollY())
	coords.bottom -= scrollY
	_(cursor).inner(coords)

  hide: (event) =>
	return if not @disabled and @hover(event, @label)
	@active @content, false
	delete @label

  remove: =>
	$(@el).off "scroll"
	$(@el).off "scroll:end"
	$(@content).off "mouseout", @hide
	$(@content).remove()


class PeriodSelectMenu extends Menu

  timer: 60

  constructor: (options) ->
	super options
	@collection.on "change:index", @update_label
	@collection.on "remove", @remove_link

  render: =>
	@$("[data-type=menu-item] [data-value]").map (index, item) =>
	  item = $(item)
	  @collection.add
		label: item.text()
		slug: item.data("slug")
		value: item.data("value")

  update_label: (model) =>
	old_content = (label = $(@label)).html() or ""
	label.html old_content.replace label.text(), model.get("label")

  value: (el) =>
	$(el or @label).text().replace /\s$/, ""

  link: (value) =>
	_.find @$("[data-type=menu-item] a"), (item) =>
	  $(item).text() is value

  select: (event = {}) =>
	super event
	options =
	  slug: $(event.target or @link @value()).data("slug")
	models = @collection.where options
	@collection.trigger "select", models[0], options
	@close()
	false

  remove_link: (model) =>
	$(link.parentNode).remove() if (link = @link model.get("label"))


class GridLoader extends Loader

  left: =>
	@coords.get("left")

  right: =>
	@coords.get("right") - @coords.get("left")

  top: =>
	@coords.get("bottom") - @el.offsetHeight


class GridMarker extends Base

  delay: 1

  constructor: (options) ->
	super options
	@model = new Period()

	@label = @$("[data-type=marker-label]").get(0)
	@model.set
	  slug: "maintenant"
	  value: "0|#{24 * 60 * 60 * 1000}"
	@model.on "destroy", @remove
	@model.on "change:left", @update
	@page.coords.on "change", @render

  render: (coords) =>
	$(@el).css
	  height: (height = coords.get("bottom") - coords.get("top"))

  update: (model) =>
	if (left = model.get("left")) > (max = @page.content.scrollWidth) or left < 0
	  @model.destroy()
	  return
	# Update @el position
	@active @el, true
	$(@el).css("left", "#{left = model.get("left")}px")

	$(@label).html model.to_string()

	# Label must be visible
	# at the end of the day (ie. 23h55)
	if (right = max - (left + @label.offsetWidth)) <= 0
	  $(@label).css
		"margin-left": "#{right}px"

	# Handle next update
	@animation = setTimeout @animate, (delay = @delay * 60 * 1000 - (date = new Date()).getSeconds() * 1000)

  scroll_value: =>
	@model.get("left") - @label.offsetWidth

  animate: =>
	value = @model.get("value").split "|"
	start = @page.collection.date.now()
	@model.set
	  value: "#{start}|#{value[1]}"

  stop: =>
	@active @el, false
	clearTimeout @animation if @animation
	delete @animation
	false

  remove: =>
	@stop()
	@model.off "destroy"
	@model.off "change:left"
	@page.coords.off "change", @render
	super


class GridMenu extends Menu

  step: =>
	value = super
	value / 2

class Calendar extends Menu

  constructor: (options) ->
	super options

	@content = $(".day-selector-inner", @el).get(0)
	$(@content).off "scroll"

  month_el: (date = {}) =>
	date = @model.data @model.today() unless date
	path = _.template "[data-month='<%=month%>'][data-year='<%=year%>']", date
	@$(path).get(0)

  day_el: (date = {}) =>
	@$("[data-date=#{@model.to_string date}]").get(0)

  select_date: (options = {}) =>
	action = options.action
	date = if action and (get_value = @model[action]) then get_value() else options.date
	data = @model.data date
	return unless (month_el = @month_el data)

	# Reset old Calendar
	old.remove() if (old = @weeks)

	# New Month Navigation
	@weeks = new Menu
	  el: month_el
	  content: $("ul", month_el).get(0)
	$(@weeks.content).off "scroll"
	$(@weeks.content).on "scroll:end", @render

	#scroll into Month.view
	if action is "next_month"
	  @weeks.scroll @weeks.scroll_min(), options
	else if action is "previous_month"
	  @weeks.scroll @weeks.scroll_max(), options
	else if (el = @day_el data)
	  @weeks.scroll el.offsetLeft, options

	# Show New Month
	@scroll @weeks.el.offsetLeft, options

  items: =>
	@$("[data-date]")

  visible: =>
	max = (min = @weeks.content.scrollLeft) + @weeks.step()
	$("[data-date]", @weeks.content).filter (indice, item) ->
	  item.offsetLeft > (min - item.offsetWidth) and item.offsetLeft < max

  render: =>
	# Select 1st item visible
	@model.set
	  value: (days = @visible()).first().data("date")
	  last: days.last().data("date")
	# Disable Menu
	@disable @$("[data-type=previous]"), @is_start (items = @items())
	@disable @$("[data-type=next]"), @is_last items

  is_start: (list) =>
	list.first().data("date") is @model.get("value")

  is_last: (list) =>
	list.last().data("date") is @model.get("last")

  open: (event) =>
	super event
	unless @model.get("value")
	  @select_date
		date: @model.today()
		duration: 0

  next: (event) =>
	unless @weeks.is_last()
	  @weeks.next()
	  return
	@select_date
	  action: "next_month"

  previous: (event) =>
	unless @weeks.is_start()
	  @weeks.previous()
	  return
	@select_date
	  action: "previous_month"


class ProgramsScroller extends Scroller

  constructor: (options) ->
	super options
	@on "scrollX", unless (is_touch = @is_touch()) then _.debounce(@update, 100) else @update
	@on "scrollY", unless (is_touch = @is_touch()) then _.throttle(@update, 500) else @update
	@on "resize", unless (is_touch = @is_touch()) then _.debounce(@update, 100) else @update
	@collection.on "show:program", @show
	@collection.on "hide:program", @hide
	@coords.on "change", @load
	@coords.on "change:left", @update_periods

  update_periods: (model) =>
	# Add 1 more pixel to be out of previous period
	data = @data {left: @el.scrollLeft + 10}
	@collection.periods.trigger "update", data

  load: (model) =>
	@collection.trigger "load", model

  left: =>
	_periods = []
	date = @collection.date.today()
	periods = @collection.periods

	# Get Visible periods
	min = periods.search @data {left: (scroll_left = @el.scrollLeft)}
	max = periods.search @data {left: (scroll_right = scroll_left + @el.offsetWidth)}
	_periods = _.range(index0 + 1, index1) if (index1 = periods.indexOf(max)) - (index0 = periods.indexOf(min)) > 1
	_periods.unshift index0
	_periods.push index1
	coords = _.map _periods, (index) ->
	  "#{(period = periods.at(index)).get('slug')}|#{date}"

	# Get Previous Period
	preload_date = date
	if (preload_x = index0 - 1) < 0
	  preload_x = periods.length - 1
	  preload_date = @collection.date.yesterday()
	preload_slug = periods.at(preload_x).get("slug")
	coords.unshift "#{preload_slug}|#{preload_date}"
	coords

  top: =>
	coords = []
	top = _(@_window).scrollY()
	bottom = top + _(@_window).innerHeight()
	@collection.channels.each (model, index) =>
	  if ((_top = model.get("top")) >= top && _top <= bottom)
		coords.push index
	  else if ((_bottom = model.get("bottom")) >= top && _bottom <= bottom)
		coords.push index
	coords.push _.last(coords) + 1
	coords

  show: (data) =>
	if (el = @$(data.path)).length
	  if _(el).is_empty()
		el.html data.content
		el.css "opacity", 0
		el.animate
		  "opacity": 1
	# console.log "SHOW", data.path

  hide: (data) =>
	if (el = @$(data.path)).length
	  el.html ""
	# console.log "HIDE", data.path

  data: (data = {}) =>
	width = @el.scrollWidth
	periods = @collection.periods
	start = periods.first().start()
	duration = periods.last().end() - start

	# Get width for a given time
	if data.time isnt undefined
	  data.left = Math.floor (data.time - start) * width / duration

	# Get time for a given width
	else if data.left isnt undefined
	  data.left = width if data.left > width
	  data.left = 0 if data.left < 0
	  time = data.left * duration / width
	  data.time = Math.floor (new Date start).setMilliseconds time
	data

  remove: =>
	@off "scrollX"
	@off "scrollY"
	@off "resize"
	@collection.off "show:program", @show
	@collection.off "hide:program", @hide
	@coords.off "change", @load
	@coords.off "change:left", @update_periods
	super


class GridFixedView extends FixedView

  constructor: (options) ->
	super options
	if @page
	  @coords.on "change:top", @update_page
	  @coords.on "change:bottom", @update_page
	@_window = _.window()
	@coords.on "change:left", @scroll_into
	@coords.on "change:bottom", @resize
	@coords.on "change:top", @resize
	@update()

  update_page: (model, context) =>
	menu = $(@menu[0], @_window.document)
	@page.coords.set _.extend _(@el).offset(),
	  top: (menu_coords = _(menu).offset()).bottom - _(@_window).scrollY()
	  bottom: _(@_window).innerHeight() - @coords.get("bottom")

  left: (coords) =>
	coords.left - @el.scrollLeft

  render: =>
	super
	@scroll_into()

  scroll_into: =>
	@header = $("[data-type=grid-header]", @el) unless @header
	@header.css
	  left: @coords.get("left")

  resize: =>
	super
	$("#breadcrumb").css
	  width: @coords.get("right")

  remove: =>
	if @page
	  @coords.off "change:top", @update_page
	  @coords.off "change:bottom", @update_page
	@coords.off "change:left", @scroll_into
	@coords.off "change:bottom", @resize
	@coords.off "change:top", @resize
	super












