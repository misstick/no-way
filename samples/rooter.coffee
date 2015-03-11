class Router extends Backbone.Router

  routes:

	"": "main"
	"series/": "category"
	"chaines/": "category"
	"seconde-partie-soiree/:date/": "soiree"
	"seconde-partie-soiree/": "soiree"
	"soiree/": "soiree"
	"soiree/:date/": "soiree"
	"chaine/:id-:slug/:date/": "category"
	"chaine/:id-:slug/": "category"
	":type/:id-:slug/:broadcastid": "detail"
	":type/:id-:slug/": "detail"
	":date/": "main"

  view: null

  constructor: (options) ->
	super options
	@_pushstate()
	$("html").removeClass "no-js"

  uri: =>
	url = _.compact location.href.split("/")
	url.splice(0,2)
	"#{url.toString().replace ',', '/'}/"

  _pushstate: =>
	if history.pushState
	  Backbone.history.start
		pushState: true
	  return

	__IE_routes =
	  "/": "main"
	  "series": "category"
	  "chaines": "category"
	  "soiree\/*([0-9]+\-[0-9]+\-[0-9]+)*": "soiree"
	  "seconde-partie-soiree\/*([0-9]+\-[0-9]+\-[0-9]+)*": "soiree"
	  "chaine/([0-9]+)\-([\\w-]+)\/*([0-9]+\-[0-9]+\-[0-9]+)*": "category"
	  "([\\w-]+)\/([0-9]*)\-([\\w-]+)\/([0-9]*)+": "detail"
	  "([0-9]*\-[0-9]*\-[0-9]*)+": "main"

	uri = @uri()
	_.find __IE_routes, (method, route) =>
	  if route is uri or (args = @args (re = new RegExp "\/#{route}\/*$")).length
		@[method].apply @, args or []
		return true

  args: (re, url) =>
	(uri = (url or location.href).match(re) or []).shift()
	uri

  detail: (type, id, slug, broadcastid) =>
	# console.log "DETAIL: type=#{type}, slug=#{slug}, id=#{id}, broadcastid=#{broadcastid}"
	@view.remove() if @view
	@view = new ProgramDetail()
	@view.render()

  soiree: (date) =>
	# console.log "soirees: date=#{date}"
	@view.remove() if @view
	@view = new SoireePage()
	@view.render()

  category: (id, slug, date) =>
	# console.log "CategoryPage: id=#{id}, slug=#{slug}, date=#{date}"
	@view.remove() if @view
	@view = new CategoryPage()
	@view.render()

  main: (date) =>
	# console.log "MAIN: #{date or null}"
	@view.remove() if @view
	@view = new GridPage()
	@view.render()


$(document).ready ->
  main = {}
  main.router = new Router()
  window.application = main
