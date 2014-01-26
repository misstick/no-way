{expect, assert} = chai

describe "Models", ->

	describe "Day", ->

		it "should convert Date String into an array", ->
			today = new Day
				day: "06-01-2013"
			result = today.to_array()
			assert.equal result[0] * 1, 6
			assert.equal result[1] * 1, 1
			assert.equal result[2] * 1, 2013

		it "should convert Date String into an Object", ->
			today = new Day
				day: "06-01-2013"
			result = today.data()
			assert.equal result.day, 6
			assert.equal result.month, 1
			assert.equal result.year, 2013

			today = new Day()
			result = today.data "06-01-2013"
			assert.equal result.day, 6
			assert.equal result.month, 1
			assert.equal result.year, 2013

		it "should return current Date +1/-1 month", ->
			today = new Day
				day: "06-01-2013"
			assert.equal today.next_month(), "06-02-2013"
			assert.equal today.previous_month(), "06-12-2012"

		it "should return the previous value of current Date", ->
			today = new Day
				day: "06-01-2013"
			assert.equal today.yesterday(), "05-01-2013"


	describe "Coords", ->

		it "save old (string) values", ->
			coords = new Coords()
			coords.set
				left: 2
			coords.set
				left: 0
			assert.equal coords._oldValues.left, 2

		it "save old (array) values", ->
			coords = new Coords()
			coords.set
				left: [0, 1, 2, 3, 4]
			coords.set
				left: [2]
			assert.ok coords._oldValues.left, [0, 1, 3, 4]

		it "test inner() with left & right coords", ->
			coords = new Coords()
			coords.set
				left: 10
				right: 100

			coords0 =
				left: 0
				right: 100
			assert.equal coords.inner(coords0), false

			coords0.left = 99
			assert.equal coords.inner(coords0), true

			coords0.left = 100
			assert.equal coords.inner(coords0), false

		it "test inner() with top & bottom coords", ->
			coords = new Coords()
			coords.set
				top: 10
				bottom: 100

			coords0 =
				top: 0
				bottom: 100
			assert.equal coords.inner(coords0), false

			coords0.top = 99
			assert.equal coords.inner(coords0), true

			coords0.top = 100
			assert.equal coords.inner(coords0), false

		it "test inner() with left, right, top & bottom coords", ->
			coords = new Coords()
			coords.set
				left: 0
				right: 200
				top: 10
				bottom: 100

			coords0 =
				left: 0
				right: 200
				top: 10
				bottom: 100
			assert.equal coords.inner(coords0), true

			coords0.top = 99
			assert.equal coords.inner(coords0), true
			coords0.left = -1
			assert.equal coords.inner(coords0), false

			coords0.top = 100
			assert.equal coords.inner(coords0), false


	describe "Period", ->

		it "should find 'start' into a model", ->
			period = new Period
				label: "Matin"
				slug: "matin"
				value: "25200000|21600000"
			assert.equal period.start(), 25200000

		it "should find 'duration' into a model", ->
			period = new Period
				label: "Matin"
				slug: "matin"
				value: "25200000|21600000"
			assert.equal period.duration(), 21600000

		it "should convert model into a date_string", ->
			hours = 23
			minutes = 30
			time = (hours  * 60 * 60 + minutes * 60) * 1000
			period = new Period
				value: "#{time}|0"
			assert.equal period.to_string(), "#{hours}h#{minutes}"


		it "should find if a timestamp belongs to a given period", ->
			hours = 23
			start = hours  * 60 * 60 * 1000
			duration = 1 * 60 * 60 * 1000
			period = new Period
				value: "#{start}|#{duration}"

			timestamp = (hours  * 60 * 60 + 30 * 60) * 1000
			assert.equal period.inner(timestamp), true

			timestamp = (hours - 1  * 60 * 60 + 30 * 60) * 1000
			assert.equal period.inner(timestamp), false

	describe "Program", ->

		it "Fetch() if !content", (done) ->
			collection = createPrograms()
			program0 = newProgram(collection)
			program1 = newProgram(collection)

			success = _.after (data = [program0, program1]).length,  =>
			 	done()

			collection.add data,
				success: success











