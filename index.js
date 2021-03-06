// =============================================================================
// BASE SETUP {{{
// =============================================================================


// call the packages we need
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var debug      = require('debug')('app:main');
var moment     = require('moment');
var config     = require('./config.json');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var mongoose   = require('mongoose');
mongoose.connect(config.mongodbURL);
var Activity   = require('./app/models/activity');

var ade = require('./app/ade/index.js')(Activity);
var roomfinder = require('./app/roomfinder/index.js')(Activity);
var testfinder = require('./app/testfinder/index.js')(Activity);


// =============================================================================
// }}}
// =============================================================================

// =============================================================================
// MAKE ROOM CACHE {{{
// =============================================================================


ade.refreshRoomsCache();
var lastRefresh = new Date();


// =============================================================================
// }}}
// =============================================================================

// =============================================================================
// ROUTES FOR OUR API {{{
// =============================================================================


// get an instance of the express Router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	debug("URI /api/calendar" + req.path + ' Requested.');

	// If it's been 10 minutes
	if(new Date() - lastRefresh >= 600000) {
		ade.refreshRoomsCache();
		lastRefresh = new Date();
	}

	// Allow CORS
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");

	// make sure we go to the next routes and don't stop here
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.jsonp({message: 'Hooray! welcome to our api :)'});
});

router.route('/activities')
	.get(function(req, res) {
		Activity.find({}, {_id:0,__v:0}, function(err, activities) {
			if (err)
				res.send(err);

			res.jsonp(activities);
		});
	});

router.route('/activities/:limit')
	.get(function(req, res) {
		Activity.find({}, {_id:0,__v:0}, function(err, activities) {
			if (err)
				res.send(err);

			res.jsonp(activities);
		}).limit(req.params.limit);
	});

router.route('/activities/:limit/:skip')
	.get(function(req, res) {
		Activity.find({}, {_id:0,__v:0}, function(err, activities) {
			if (err)
				res.send(err);

			res.jsonp(activities);
		}).limit(req.params.limit)
		  .skip(req.params.skip);
	});

router.route('/tests')
	.get(function(req, res) {
		testfinder.findNextTests(function(err, tests) {
		                         	if(err)
		                         		res.send(err);

		                         	res.jsonp(tests)
		                         });
	});

router.route('/tests/:promotion')
	.get(function(req, res) {
		testfinder.findNextTestsFor(req.params.promotion,
		                            function(err, tests) {
		                            	if(err)
		                            		res.send(err);

		                            	res.jsonp(tests)
		                            });
	});

router.route('/refresh')
	.get(function(req, res) {
		ade.refreshRoomsCache();
		debug('Database refresh requested.');
		res.jsonp({message: 'Rooms refreshed!'});
	});

router.route('/rooms')
	.get(function(req, res) {
		roomfinder.findRoomNow(function(err, rooms) {
			if(err)
				res.send(err);

			res.jsonp(rooms)
		});
	});

router.route('/rooms/:date')
	.get(function(req, res) {
		roomfinder.findRoom(moment(req.params.date),
		                    function(err, rooms) {
		                    	if(err)
		                    		res.send(err);

		                    	res.jsonp(rooms)
		                    });
	});


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api/calendar', router);

// =============================================================================
// }}}
// =============================================================================

// =============================================================================
// START THE SERVER {{{
// =============================================================================


app.listen(port);
console.log('Magic happens on port ' + port);


// =============================================================================
// }}}
// =============================================================================

// vim: fdm=marker
