class Period extends Backbone.Model

	start: (value) =>
		@to_array(value)[0] * 1

	end: (value) =>
		@start(value) + @duration(value)

	duration: (value) =>
		(@to_array(value)[1] * 1) or 0

	to_array: (value) =>
		if (time = value or @get "value").split then time.split("|") else [time, 0]

	to_string: (value) =>
		value = @start() if value is undefined
		value = value / 1000
		format = (value) ->
			if (time = "#{Math.floor value}").length < 2 then "0#{time}" else "#{time}"
		"#{hours = format value / (60 * 60)}h#{format (value - hours * 60 * 60) / 60}"

	destroy: (args...) =>
		@trigger "destroy", args...
		delete @

	inner: (time) =>
		time >= @start() and time <= @end()


class Day extends Backbone.Model

	today: =>
		@get("day")

	to_array: (value) =>
		value = @get("value") or @today() unless value
		value = value.split "-" if value.split
		value

	parse: (value) =>
		Date.parse @to_date value or @today()

	to_string: (data = {}) =>
		data = @data data.date if data.date
		data.day = "0#{data.day}" if data.day < 10
		data.month = "0#{data.month}" if data.month < 10
		_.template "<%=day%>-<%=month%>-<%=year%>", data

	to_date: (value) =>
		value = @get("day") unless value
		value = @to_array value if typeof value is "string"
		if _.isArray(value)
			return new Date value[2], value[1] - 1, value[0]
		if value then new Date(value) else new Date()

	data: (data) =>
		return unless (date = @to_date data)
		{
			day: date.getDate()
			month: date.getMonth() + 1
			year: date.getFullYear()
		}

	next_month: =>
		value = @to_array()
		value[1]++
		@to_string @data value

	previous_month: =>
		value = @to_array()
		value[1]--
		@to_string @data value

	yesterday: =>
		value = @to_array @today()
		value[0]--
		value[0] = "0#{value[0]}" if value[0] < 10
		"#{value[0]}-#{value[1]}-#{value[2]}"

	now: =>
		((date = new Date()).getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds()) * 1000

class Coords extends Backbone.Model

	inner: (coords) =>
		test0 = true
		test1 = true
		test0 = coords.top >= @get("top") and coords.top < @get("bottom") if coords.top isnt undefined
		test1 = coords.left >= @get("left") and coords.left < @get("right") if coords.left isnt undefined
		test0 and test1

	change: (args...) =>
		data = @previousAttributes()
		if @hasChanged("left") and _.isArray (left = @get("left"))
			data.left = _.difference data.left, left
		if @hasChanged("top") and _.isArray (top = @get("top"))
			data.top = _.difference data.top, top
		@_oldValues = data
		super args...


class Program extends Backbone.Model

	constructor: (data, options) ->
		super data, options

		@on "hide", @hide
		@on "show", @show

		@on "error", (args...) ->
			console.warn "No url to fetch data", args...

		# Fetch content if it doesnt exist
		@fetch options unless @get("content")


	parse: (resp, xhr) =>
		@set "content", value for key, value of resp
		super resp, xhr

	timestamp: =>
		return unless (periods = @collection.periods)
		period_slug = @get "period"
		period = periods.find (period) =>
			period.get("slug") is period_slug
		return unless period
		"#{@get('date') + period.start()}-#{period.duration()}"

	url: =>
		return if (time = @timestamp()) is undefined
		_.template "/ajax/<%=channel%>/<%=time%>/",
			channel: @get("channel_index")
			time: time

	sync: (method, data, options = {}) =>
		unless (options.url = options.url or @url())
			options.error data
			return
		if @collection.test
			options.success()
			return
		Backbone.sync.call @, method, data, options

	path: (date) =>
		date = @collection.date.to_string {date: @get("date")} unless date
		"[data-slug=#{@get('channel')}] [data-slug=#{@get('period')}][data-day=#{date}]"

	show: =>
		$(fragment = document.createDocumentFragment()).append @get("content")
		@_buffer = fragment
		@collection.trigger "show:program",
			path: @path()
			content: @_buffer

	hide: =>
		delete @_buffer
		@collection.trigger "hide:program",
			path: @path()
