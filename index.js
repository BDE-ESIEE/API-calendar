// =============================================================================
// BASE SETUP
// =============================================================================


// call the packages we need
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var chalk      = require('chalk');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/mobile_api');
var Activity   = require('./app/models/activity');

var ade = require('./app/ade/index.js')(Activity);
var roomfinder = require('./app/roomfinder/index.js')(Activity);
var testfinder = require('./app/testfinder/index.js')(Activity);


// =============================================================================
// MAKE ROOM CACHE
// =============================================================================


ade.refreshRoomsCache();
var lastRefresh = new Date();


// =============================================================================
// ROUTES FOR OUR API
// =============================================================================


var requestsLogPrefix = chalk.bold.underline("[Request]") + " ";

// get an instance of the express Router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log(requestsLogPrefix + "URI /api" + req.path + ' Requested.');

	// If it's been 10 minutes
	if(new Date() - lastRefresh >= 600000) {
		ade.refreshRoomsCache();
		lastRefresh = new Date();
	}

	// make sure we go to the next routes and don't stop here
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({message: 'Hooray! welcome to our api!'});
});

router.route('/activities')
	.get(function(req, res) {
		Activity.find(function(err, activities) {
			if (err)
				res.send(err);

			res.json(activities);
		});
	});

router.route('/activities/:activity_id')
	.get(function(req, res) {
		Activity.findById(req.params.activity_id, function(err, activity) {
			if(err)
				res.send(err);

			res.json(activity);
		});
	});

router.route('/tests')
	.get(function(req, res) {
		testfinder.findNextTests(res);
	});

router.route('/tests/:promotion')
	.get(function(req, res) {
		testfinder.findNextTestsFor(req.params.promotion, res);
	});

router.route('/refresh')
	.get(function(req, res) {
		ade.refreshRoomsCache();
		console.log(requestsLogPrefix + 'Database refresh requested.');
		res.json({message: 'Rooms refreshed!'});
	});

router.route('/rooms')
	.get(function(req, res) {
		roomfinder.findRoomNow(res);
	});

router.route('/rooms/:date')
	.get(function(req, res) {
		roomfinder.findRoom(new Date(Date.parse(req.params.date)), res);
	});


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


// =============================================================================
// START THE SERVER
// =============================================================================


app.listen(port);
console.log('Magic happens on port ' + port);
