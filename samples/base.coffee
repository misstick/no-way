_.mixin
  is_empty: (el) ->
	not el.html().match /\s/gi

  pageX: (event) ->
	# FIX: ajouter la version pour IE
	event.pageX

  pageY: (event) ->
	# FIX: ajouter la version pour IE
	event.pageY

  window: ->
	if (iframe = $("#body").get(0)) then iframe.contentWindow else window

  screenX: (_window, event) ->
	_(event).pageX() - _(_window).scrollX()

  screenY: (_window, event) ->
	_(event).pageY() - _(_window).scrollY()

  scrollX: (_window) ->
	if _window.scrollX is undefined then _window.document.documentElement.scrollLeft else _window.scrollX

  scrollY: (_window) ->
	if _window.scrollY is undefined then _window.document.documentElement.scrollTop else _window.scrollY

  innerHeight: (_window) ->
	if _window.innerHeight is undefined then _window.document.documentElement.clientHeight else _window.innerHeight

  offset: (el) ->
	if _.isArray el
	  coords = null
	  _.each el, (path) ->
		$(path).each (index, el) ->
		  _coords = _(el).offset()
		  coords = _coords unless coords
		  coords.top = _coords.top if coords.top > _coords.top
		  coords.left = _coords.left if coords.left > _coords.left
		  coords.right = _coords.right if coords.right < _coords.right
		  coords.bottom = _coords.bottom if coords.bottom < _coords.bottom
	  return coords

	_.extend (coords = (el = $(el)).offset()),
	  right: coords.left + el.width()
	  bottom: coords.top + el.height()

  inner: (coords, coords_ref) ->
	(coords.left >= coords_ref.left and coords.left < coords_ref.right) and (coords.top >= coords_ref.top and coords.top < coords_ref.bottom)



class Base extends Backbone.View

  parent: null

  constructor: (options = {}) ->
	super options
	@page = options.page if options.page
	@content = options.content if options.content
	@coords = options.coords if options.coords

  disable: (el, value) =>
	value = if typeof value is "undefined" then true else value
	action = if value then "addClass" else "removeClass"
	$(el)[action] "disabled"
	value

  active: (el, value) =>
	action = if value then "addClass" else "removeClass"
	$(el)[action] "active"
	value

  hide: (el, value) =>
	value = true if value is undefined
	$(el)[if value then "addClass" else "removeClass"] "hide"
	value

  is_active: (el) =>
	$(el or @el).hasClass "active"

  active_el: =>
	@$(".active")

  is_touch: =>
	$("html").hasClass "touch"

  scroll: (value, options = {}) =>
	content = $(el = options.el or @content or @el)
	content.stop()
	success = options.success
	_.extend options,
	  complete: (args...) =>
		$(el).trigger "scroll:end", args...
		success() if success
	content.animate
		"scrollLeft": value
	  , options

class Loader extends Base

  counter: 0

  coords: new Coords()

  delay: 1000

  constructor: (options) ->
	super options
	@collection.on "load:start", @loading
	@collection.on "load:stop", @stop_loading
	@coords.on "change", @render

  render: =>
	$(@el).css
	  left: @left()
	  width: @right()
	  top: @top()

  left: =>
	0

  right: =>
	@el.offsetWidth

  top: =>
	0

  loading: (options = {}) =>
	@counter = if options.data then options.data.length or 1
	$(@el).addClass "active"
	@render()

  stop_loading: =>
	setTimeout =>
	  unless --@counter
		$(@el).removeClass "active"
		@collection.trigger "load:end"
	, @delay


class Page extends Base
  el: "#main-container"

  window: {}

  events: =>
	"click [data-type=link]": "goto"
	# "click [data-target=blank]": "open_window"

  menu: {}

  constructor: (options) ->
	super options

	@content = @$("[data-type=page-content]").get(0)
	$(@el).delegate @el, "click", (event) =>
	  _.each @menu, (menu) =>
		menu.trigger "#{menu.cid}:close", event if menu and not menu.inner(event)

  render: =>
	if (day_el = @$("#day-selector")).get(0) and @collection
	  # Programs needs to know which day we are
	  @collection.date = new Day
		day: day_el.data("day")

	  # Navigate between days
	  @menu["calendar"] = new Calendar
		el: day_el
		page: @
		model: @collection.date


	# Menu de base
	@$("[data-type=select-menu]").each (index, item) =>
	  menu = new FilterMenu
		el: item
		page: @
	  @menu[menu.cid] = menu

	# FIX: filtres non utilisés pour le moment
	# # Filtres
	# @$("[data-type=menu-filter]").each (index, item) =>
	#   @menu.filter = [] unless @menu.filter
	#   @menu.filter.push(new FilterMenu
	#     el: $(item)
	#     page: @
	#   )

  # touchstart: (event) =>
  #   $(event.currentTarget).addClass "active"
  #
  # touchend: (event) =>
  #   $(event.currentTarget).removeClass "active"

  # open_window: (event) =>
  #   event.preventDefault()
  #   target = event.currentTarget
  #   id = $(target).data("id") or "window-#{(_.keys @window).length}"
  #   unless @window[id]
  #     @window[id] = new FakeWindow
  #       el: @$("[data-type=window]")
  #       id: id
  #       url: target.href
  #       page: @
  #
  #   @window[id].open()

  target: (el) =>
	$(el).data("target") or el.hash

  goto: (event) =>
	event.preventDefault()
	if (method = @[(action = @action event.currentTarget)])
	  method.call @, event
	else
	  Backbone.history.navigate action, true
	@

  remove: =>
	_.each @menu.select, (item, index) =>
	  item.remove()
	_.each @menu.filter, (item, index) =>
	  item.remove()
	_.each @window, (item, index) =>
	  item.remove()
	super


class Menu extends Base

  events: =>
	"click [data-type=menu-label]": "open"
	"click [data-type=menu-item]": "select"
	"click [data-type=menu-group]": "select"
	"click [data-tracking]": "tracking"
	"click [data-type=previous]": "previous"
	"click [data-type=next]": "next"

  constructor: (options) ->
	super options
	@label = @$("[data-type=menu-label]")[0]
	@content = @$($(@label).data("content")).get(0) unless @content
	$(@content).on "scroll", _.throttle(@render, 200) if @content

	@on "#{@cid}:close", @close

	# Init
	@active @el, false

  active: (el, value) =>
	el = parent if (parent = $(el).parent("[data-type=menu-item]")[0])
	super el, value

  select: (event) =>
	@active @active_el(), false
	@active event.currentTarget, true

  open: (event) =>
	event.preventDefault() if event
	value = !@is_active @content or @el
	@active @content, value
	@active @el, value
	value

  tracking: (event) =>
	data = $(target = event.currentTarget).data("tracking").split("|")
	url = url = "#{xtsd}.xiti.com/go.click?xts=#{xtsite}&s2=#{data[0]}&p=#{data[1]}&clic=N&type=click&url=#{document.location.href}"
	$.ajax
	  type: "GET"
	  url: url
	  cache: false

  inner: (event) =>
	if event then $(@el).has(event.target).length or $(@content).has(event.target).length else false

  step: (data = {}) =>
	@content.offsetWidth

  next: (event, options) =>
	event.preventDefault() if event
	@scroll @content.scrollLeft + @step(), options

  previous: (event, options) =>
	event.preventDefault() if event
	@scroll @content.scrollLeft - @step(), options

  scroll_min: =>
	0

  scroll_max: =>
	@content.scrollWidth - @content.offsetWidth

  is_start: =>
	@content.scrollLeft is @scroll_min()

  is_last: =>
	@content.scrollLeft is @scroll_max()

  render: =>
	@disable @$("[data-type=previous]"), @is_start()
	@disable @$("[data-type=next]"), @is_last()

  close: (event) =>
	@active @content, false
	@active @el, false

  remove: =>
	$(@content).off "scroll" if @content
	$("body").undelegate @page.el, "click", @_close_handler if @page
	@undelegateEvents()


class FilterMenu extends Menu

  constructor: (options) ->
	super options
	# Get Content concerned by filters
	items = _.map ($(@el).data("items") or "").split(","), (item, index) =>
	  if $(item).length then item else false
	@items = items if (items = _.compact items).length

	if (input = @$("[data-type=menu-search]")).length and @collection
	  $(@el).undelegate "[data-type=menu-item]", "click"
	  $(@el).undelegate "[data-type=menu-group]", "click"
	  @autocomplete = new AutocompleteField
		el: input
		default: $("[data-type=default-value] a", input)[0]
		collection: @collection
		menu: @

  open: (event) =>
	open = super event
	@autocomplete.focus() if @autocomplete and open
	open

  # results: (el) =>
  #   return unless @collection
  #   link = $(">a", el)[0] or el
  #   @collection.where {slug: $(link).data("slug")}

  # select: (event) =>
  #   super event
  #   return unless (results =  @results event.currentTarget)
  #   event.preventDefault()
  #   console.log "FILTER", results


class AutocompleteField extends Base

  events: =>
	"click [data-action=reset]": "reset"

  constructor: (options) ->
	super options
	@menu = options.menu
	$(@el).addClass "fake-element"
	@field = @$("input[type=search]")

	# Valeur par défaut
	if (defaultValue = $(options.default)).length
	  @defaultValue =
		index: -1
		label: defaultValue.text()
		slug: defaultValue.data "slug"
		url: defaultValue.attr "href"
		value: ""

	@field.autocomplete
	  delay: 0,
	  minLength: 0
	  appendTo: $(@el).parent()
	  source: @source
	  select: @select
	.data("autocomplete")._renderItem = (ul, item) =>
	  $(@template item)
		.data("item.autocomplete", item)
		.appendTo(ul)

  active: (item, value) =>
	$(item)[if value then "removeClass" else "addClass"]("disabled")

  select: (event, ui) =>
	event.preventDefault() if event
	@menu.close()
	return unless @menu.items
	scroll_coords = false
	_.each @menu.items, (path) =>
	  $(path).map (index, item) =>
		slug = $(item).data("slug") or $("a", item).data("slug")
		active = if ui.item.slug is "all" then true else slug is ui.item.slug
		@active item, active
		scroll_coords = $(item).offset() if active and not scroll_coords

	@field.val ui.item.value
	if scroll_coords and ui.item isnt @defaultValue
	  scrollTo 0, scroll_coords.top

  focus: =>
	@field.focus()
	@field.autocomplete "search", @defaultValue.value
	@

  reset: =>
	@select null, {item: @defaultValue}
	@

  # group: (value) =>
  #   result = _.filter @data.groups, (group) ->
  #     group.slug is value
  #   if result.length then result[0] else null

  source: (request, response) =>
	result = @collection.map (model, index) ->
	  model.set "label", model.get("name")
	  model.set "group", true
	  model.attributes

	models = $.ui.autocomplete.filter result, request.term
	# _group = null
	# result = []
	# for model, index in models
	#   # FIX : au cas omù on grouperait les données
	#   # if item.group and item.group isnt _group
	#   #   _group = item.group
	#   #   result.push group if (group = @group _group)
	#   result.push model
	models.unshift @defaultValue
	response models

  template: (model) ->
	type = if model.group then "item" else "group"
	"<li data-type='menu-#{type}'><a href='#{model.url}' data-value='#{model.slug}'>#{model.label}</a></li>"


class Scroller extends Base

  constructor: (options) ->
	super options
	@coords = new Coords()
	@_window = _.window()
	$(@_window).on "scroll", @scrollY
	$(@_window).on "resize", @resize
	$(@el).on "scroll", @scrollX

  update: (coords) =>
	coords = _(@el).offset()
	@coords.set
	  left: @left coords
	  top: @top coords
	  bottom: @bottom coords
	  right: @right coords

  left: (coords) =>
	coords.left

  right: (coords) =>
	coords.right

  bottom: (coords) =>
	coords.bottom

  top: (coords) =>
	coords.top

  scrollY: (event) =>
	@trigger "scrollY", event

  scrollX: (event) =>
	@trigger "scrollX", event

  resize: (event) =>
	@trigger "resize", event

  remove: =>
	$(@_window).off "scroll"
	$(@_window).off "resize"
	$(@el).off "scroll"
	super


class FixedView extends Scroller

  constructor: (options) ->
	super options
	@menu = options.menu
	@on "scrollX", @update
	@on "scrollY", @update
	@on "resize", @update
	@coords.on "change:top", @render

  bottom: (coords) =>
	value = 0 if (value = _(@_window).scrollY() + _(@_window).innerHeight() - coords.bottom) < 0
	value

  is_frozen: =>
	not @coords.get("top")

  top: (coords) =>
	menu = $(@menu[0], @_window.document)
	@_min_top = _(menu).offset().top if @_min_top is undefined
	value = 0 if (value = @_min_top - _(@_window).scrollY()) < 0
	value = @_min_top if value > @_min_top
	value

  offset: (el, previous) =>
	style =
	  position: "fixed"
	  "z-index": 1010
	  top: 0
	  left: 0
	  width: "auto"
	if (previous = $(previous, @_window.document)).get(0)
	  _.extend style,
		top: (_coords = _(previous).offset()).bottom - _coords.top
	style

  render: =>
	# Reset Fixed Layout
	# console.log @coords.attributes.top, @coords.oldValues().top
	_document = @_window.document
	unless @is_frozen()
	  _.each @menu, (path) =>
		$(path, _document).each (index, el) =>
		  if (style = (el = $(el)).data("static")) isnt undefined
			el.attr "style", style
	  return

	# Add Fixed Layout to each element of @menu
	_.each @menu, (path, index) =>
	  style = @offset path, @menu[index - 1]
	  $(path, _document).each (i, el) =>
		el = $(el)
		# Save defaut style
		el.data "static", el.attr("style") or ""
		# Add Fixed style
		el.css _.extend style, {width: el.width()}

  remove: =>
	@off "scrollX", @update
	@off "scrollY", @update
	@off "resize", @update
	@coords.off "change:top", @render
	super


class FakeWindow extends Page

  events: =>
	_.extend super,
	  "click [data-action=close]": @close

  constructor: (options) ->
	super options
	$(@el).bind "click", (event) =>
	  @close() if event.target is @el

  open: =>
	@active @el, true
	$("body").addClass "window-active"

  close: =>
	@active @el, false
	$("body").removeClass "window-active"
	false

  remove: =>
	super
	$(@el).unbind "click"
