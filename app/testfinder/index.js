var debug = require('debug')('app:testfinder');

var testfinder = {};

testfinder.findNextTests = function(callback) {

	debug("Finding tests");

	testfinder.Activity.find({
		name: {
			//$regex: /^(?:[A-Z]{2,3}|LV1)-\d{4}[A-Z]?:CTRL$/
			$regex: /:CTRL$/
		}
	}, {_id:0,__v:0}, function(err, activities) {
		if(err) {
			console.error(err);
			callback(err, null);
			return;
		}

		callback(null, activities);
	});
}

testfinder.findNextTestsFor = function(promotion, callback) {

	debug("Finding tests for promotion " + promotion);

	// Transform E2, E3FR, etc… to 2, 3, etc…
	promotion = promotion.substr(1, 1);

	testfinder.Activity.find({
		name: {
			// Can't figure out what to what promotion corresponds a test of type:
			// EN5A11A:CTRL
			$regex: new RegExp("^(?:[A-Z]{2,3}|LV1)-" + promotion + "\\d{3}[A-Z]?:CTRL$")
		}
	}, {_id:0,__v:0}, function(err, activities) {
		if(err) {
			console.error(err);
			callback(err, null);
			return;
		}

		callback(null, activities);
	});
}

module.exports = function(Activity) {
	testfinder.Activity = Activity;
	return {
		'findNextTests'   : testfinder.findNextTests,
		'findNextTestsFor': testfinder.findNextTestsFor
	};
}
