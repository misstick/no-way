class Collection extends Backbone.Collection

class PeriodCollection extends Collection

  index: 0

  model: Period

  constructor: (args...) ->
	super args...
	@on "update", @update

  comparator: (a, b) =>
	a.start() - b.start()

  selected: =>
	@at @index

  update: (data, options = {}) =>
	if (model = @search data)
	  @index = @indexOf model
	  options.success model if options.success
	  @trigger "change:index", model unless options.silent
	else if options.error
	  options.error slug

  search: (data) =>
	@find (model) ->
	  model.inner(data.time)

class ChannelCollection extends Collection

  comparator: (a, b) =>
	a.get("index") - b.get("index")


class ProgramsCollection extends Collection

  model: Program

  constructor: (args...) ->
	super args...
	@periods = new PeriodCollection()
	@channels = new ChannelCollection()
	@on "load", @load

  search: (data) =>
	@find (model) ->
	  model.get("channel_index") is data.channel_index and model.get("period") is data.period and model.get("date") is data.date

  show: (values) =>
	_data = []
	periods = values.left
	channels = values.top
	_.each periods, (period) =>
	  _.each channels, (index) =>
		return unless (channel = @channels.at index)
		data =
		  period: (time = period.split("|"))[0]
		  date: @date.parse time[1]
		  channel: channel.get("slug")
		  channel_index: channel.get("index")
		unless (program = @search data)
		  _data.push data
		  return
		# Display loaded data
		program.trigger "show"

	# Get ALL unloaded data at the same time
	if _data.length
	  @trigger "load:start", {data: _data}
	  @add _data,
		wait: true
		success: (program) =>
		  program.trigger "show"
		  @trigger "load:stop"

  hide: (values) =>
	_.each values.left, (period) =>
	  _.each values.top, (channel) =>
		data =
		  period: (time = period.split("|"))[0]
		  date: @date.parse time[1]
		  channel_index: channel
		program.trigger "hide" if (program = @search data)

  load: (model) =>
	@show model.attributes
	@hide model._oldValues


programs_collection = new ProgramsCollection()








