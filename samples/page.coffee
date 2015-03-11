class GridPage extends Page

  collection: programs_collection

  coords: new Coords()

  constructor: (options) ->
	super options
	# Scroll from PeriodSelectMenu.select
	@collection.periods.on "select", (model, options = {}) =>
	  model = @marker.model if not model and options.slug is "maintenant"
	  @scroll (@timeline.data {time: model.start()}).left, options if model

  render: =>
	super
	# SelectMenu: Day + Period
	@menu["breadcrumb"] = new PeriodSelectMenu
	  el: @$("[data-type=breadcrumb]")
	  collection: @collection.periods
	  page: @

	# Save DOM into :
	# @channels: Channels
	# @collection: Programs
	@save()

	# Save:
	# @periods: Periods
	@menu["breadcrumb"].render()

	# Handle ScrollEvents
	@timeline = new ProgramsScroller
	  el: @content
	  collection: @collection

	@fixed = new GridFixedView
	  el: @content
	  menu: ["#breadcrumb", ".schedule-head"]
	  page: @

	# Display Load notifications
	@loader = new GridLoader
	  el: $("#loader-channel")
	  collection: @collection
	  coords: @coords

	# Do not Handle Tooltips for touch screens
	unless (is_touch = @is_touch())
	  @tooltips = new ToolTip
		el: @content
		coords: @coords

	# Scroll Navigaton into GridContent
	@menu["play"] = new GridMenu
	  el: @$("#scroll-menu")
	  content: @content

	# FIX: afficher le lien "now" dans le menu +
	# lui affecter une valeur par défaut
	# Show where is period.now
	if (el = $("[data-slug=maintenant]", @menu["breadcrumb"].el)).get(0)
	  $(parent).removeClass "hide" if (parent = el.parents(".hide").get(0))
	  @marker = new GridMarker
		el: @$(".schedule-cursor")
		page: @
	  # Show GridMarker for the 1rst rendering
	  page = @
	  @marker.model.on "change:value", @update_now
	  @marker.animate()
	else
	  $(@content).trigger "scroll"

	# Select "GRID" tab
	$("#nav-bar-grid").addClass "active"

  update_now: (model) =>
	old = model.get("left")
	model.set (data = @timeline.data {time: model.start()})
	@scroll @marker.scroll_value() if old is undefined

  save: =>
	@$(".schedule-side .schedule-line a").map (index, item) =>
	  item = $(item)
	  # console.log "SAVE CHANNEL", index
	  @collection.channels.add
		index: index
		slug: (slug = item.data "slug")
		top: (top = item.offset().top)
		bottom: top + item.height()

	# Save ever loaded programs
	# to avoid blink effect with unloaded content
	(periods = $("#channel-programs .schedule-period")).each (index, el) =>
	  return if _(el = $(el)).is_empty()
	  data = el.data()
	  @collection.add
		period: data["slug"]
		channel: el.parent(".schedule-line").data("slug")
		content: el.html()
		date: @collection.date.parse data["day"]
	@

  remove: =>
	if @marker
	  @marker.model.off "change:value", @update_now
	  @marker.remove()
	@menu["breadcrumb"].remove() if @menu["breadcrumb"]
	@timeline.remove() if @timeline
	@menu["play"].remove() if @menu["play"]
	super

class ProgramDetail extends Page

  events: =>
	_.extend super,
	  "click .hashtag": "twitter_select"
	  "click .thumbnail-controls": "play_video"

  constructor: (options) ->
	super options
	if (tabs = @$("[data-type=tab-container]")).length
	  @tabs = new Tabs
		el: tabs

  twitter_select: (event) =>
	@$("input", event.currentTarget).select()
	# FIX : voir si on peut copier automatiquement cette valeur

  render: =>
	super
	@tabs.render() if @tabs

  play_video: (event) =>
	url = $(el = event.currentTarget).data "url"
	target = $($(el).data "target")
	postscribe target[0], "<script type='text/javascript' src='#{url}'></script>"
	@hide target, false
	@hide $(el), true

  remove: =>
	@tabs.remove()

class SoireePage extends Page

  collection: programs_collection

  render: =>
	super
	$("#nav-bar-evening").addClass "active"

class CategoryPage extends Page

  collection: programs_collection
