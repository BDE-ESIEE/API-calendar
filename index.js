// index.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port


var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/calendar_test'); // connect to our database
var Activity     = require('./app/models/activity');
// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log(req.path + ' Requested.');
	
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'Hooray! welcome to our api!' });   
});

router.route('/activities')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {
        
        var activity = new Activity();      // create a new instance of the Bear model
        activity.name = req.body.name;  // set the bears name (comes from the request)

        // save the bear and check for errors
        activity.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Activity created!' });
        });
        
    })
    .get(function(req, res) {
        Activity.find(function(err, activities) {
            if (err)
                res.send(err);

            res.json(activities);
		});
	});
// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);