{expect, assert} = chai

describe "Collections", ->

	describe "Periods", ->

		it "should find 'period' with {time:value}", ->
			periods = createPeriods()
			assert.equal periods.search({time: 25250000}), periods.at(1)

		it "should select a given 'period'", ->
			periods = createPeriods()
			periods.on "change:index", (callback = sinon.spy())

			periods.trigger "update", {time: 72000000}
			assert.equal periods.index, 2
			assert.equal callback.callCount, 1

			periods.trigger "update", {time: 26000000}, {silent: true}
			assert.equal periods.index, 1
			assert.equal callback.callCount, 1
