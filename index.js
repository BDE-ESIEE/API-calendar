// =============================================================================
// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/calendar_test');
var Activity   = require('./app/models/activity');


// =============================================================================
// MAKE ROOM CACHE
// =============================================================================

var ade = require('./app/ade/index.js')(Activity);

ade.refreshRoomsCache();
// Refresh every hours
setInterval(ade.refreshRoomsCache, 3600000);

// =============================================================================
// ROUTES FOR OUR API
// =============================================================================


// get an instance of the express Router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log(req.path + ' Requested.');

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

router.route("/activities/:activity_id")
	.get(function(req, res) {
		Activity.findById(req.params.activity_id, function(err, activity) {
			if(err)
				res.send(err);

			res.json(activity);
		});
	});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


// =============================================================================
// START THE SERVER
// =============================================================================

app.listen(port);
console.log('Magic happens on port ' + port);
