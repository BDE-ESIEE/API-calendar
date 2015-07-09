// =============================================================================
// BASE SETUP {{{
// =============================================================================


// call the packages we need
var express        = require('express');
var passport       = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var app            = express();
var bodyParser     = require('body-parser');
var cookieParser   = require('cookie-parser');
var session        = require('express-session');
var flash          = require('connect-flash');
var debug          = require('debug')('app:main');
var moment         = require('moment');

var config         = require('./config.json');
var authConfig     = require('./auth.json');
var secretConfig   = require('./secrets.json');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
	secret: secretConfig.sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var mongoose   = require('mongoose');
mongoose.connect(config.mongodbURL);
var Activity   = require('./app/models/activity');
var User       = require('./app/models/user');

var port = process.env.PORT || 8080;

var ade = require('./app/ade/index.js')(Activity);
var roomfinder = require('./app/roomfinder/index.js')(Activity);
var testfinder = require('./app/testfinder/index.js')(Activity);

// =============================================================================
// }}}
// =============================================================================


// =============================================================================
// PASSPORT CONFIG {{{
// =============================================================================


var isLogged = function(req, res, next) {
	if(req.isAuthenticated())
		return next();

	//res.redirect('/api/message/login');
	res.status(403).json({error: "You must be logged in to see this page"});
}

passport.serializeUser(function(user, done) {
	console.log("Serializing user " + user.id);
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		console.log("Deserializing user " + id);
		done(err, user);
	});
});

passport.use(new GoogleStrategy(authConfig,
	function(token, refreshToken, profile, done) {
		process.nextTick(function() {
			User.findOne({'googleId': profile.id}, function(err, user) {
				if(err)
					return done(err);

				if(user) {
					return done(null, user);
				} else {
					var newUser         = new User();
					newUser.googleId    = profile.id;
					newUser.googleToken = token;
					newUser.name        = profile.displayName;
					newUser.email       = profile.emails[0].value;

					newUser.save(function(err) {
						if(err)
							throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}
));


// =============================================================================
// }}}
// =============================================================================


// =============================================================================
// MAKE ROOM CACHE
// =============================================================================


ade.refreshRoomsCache();
var lastRefresh = new Date();


// =============================================================================
// ROUTES FOR OUR CALENDAR API {{{
// =============================================================================


// get an instance of the express Router
var calendarRouter = express.Router();

// middleware to use for all requests
calendarRouter.use(function(req, res, next) {
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
calendarRouter.get('/', function(req, res) {
	res.jsonp({message: 'Hooray! welcome to our api :)'});
});

calendarRouter.get('/activities', function(req, res) {
	Activity.find({}, {_id:0,__v:0}, function(err, activities) {
		if (err)
			res.send(err);

		res.jsonp(activities);
	});
});

calendarRouter.get('/activities/:limit', function(req, res) {
	Activity.find({}, {_id:0,__v:0}, function(err, activities) {
		if (err)
			res.send(err);

		res.jsonp(activities);
	}).limit(req.params.limit);
});

calendarRouter.get('/activities/:limit/:skip', function(req, res) {
	Activity.find({}, {_id:0,__v:0}, function(err, activities) {
		if (err)
			res.send(err);

		res.jsonp(activities);
	}).limit(req.params.limit)
	  .skip(req.params.skip);
});

calendarRouter.get('/tests', function(req, res) {
	testfinder.findNextTests(function(err, tests) {
								if(err)
									res.send(err);

								res.jsonp(tests)
							 });
});

calendarRouter.get('/tests/:promotion', function(req, res) {
	testfinder.findNextTestsFor(req.params.promotion,
								function(err, tests) {
									if(err)
										res.send(err);

									res.jsonp(tests)
								});
});

calendarRouter.get('/refresh', function(req, res) {
	ade.refreshRoomsCache();
	debug('Database refresh requested.');
	res.jsonp({message: 'Rooms refreshed!'});
});

calendarRouter.get('/rooms', function(req, res) {
	roomfinder.findRoomNow(function(err, rooms) {
		if(err)
			res.send(err);

		res.jsonp(rooms)
	});
});

calendarRouter.get('/rooms/:date', function(req, res) {
	roomfinder.findRoom(moment(req.params.date),
						function(err, rooms) {
							if(err)
								res.send(err);

							res.jsonp(rooms)
						});
});


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api/calendar', calendarRouter);

// =============================================================================
// }}}
// =============================================================================


// =============================================================================
// ROUTES FOR OUR MESSAGE API {{{
// =============================================================================


var messageRouter = express.Router();

messageRouter.use(function(req, res, next) {
	debug('URI /api/message' + req.path + ' Requested.');

	// Allow CORS
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");

	next();
});

messageRouter.get('/login',
                   passport.authenticate('google', {
                   	scope : ['profile', 'email']
                   }));

messageRouter.get('/login/callback',
                   passport.authenticate('google', {
                   	successRedirect: '/api/message/login/success',
                   	failureRedirect: '/api/message/login'
                   }));

messageRouter.get('/login/success', isLogged, function(req, res) {
	res.json({'message': 'You are successfully logged in'});
});

messageRouter.get('/users', isLogged, function(req, res) {
	User.find({}, function(err, users) {
		if(err)
			throw err;

		res.json(users);
	});
});

messageRouter.get("/user", isLogged, function(req, res) {
	res.json(req.user);
});

messageRouter.route("/user/clubs")
	.get(isLogged, function(req, res) {
		res.json(req.user.clubs);
	})

	.post(isLogged, function(req, res) {
		User.findById(req.user._id, function(err, user) {
			user.update({$addToSet: {clubs: req.body.club}},
			            function(err, msg) {
							if(err)
								return res.status(500).json(err);
			            	res.json(msg);
						});
		});
	})

	.delete(isLogged, function(req, res) {
		User.findById(req.user._id, function(err, user) {
			user.update({$pull: {clubs: req.body.club}},
			            function(err, msg) {
							if(err)
								return res.status(500).json(err);
			            	res.json(msg);
						});
		});
	});

app.use('/api/message/', messageRouter);

// =============================================================================
// }}}
// =============================================================================

// =============================================================================
// START THE SERVER
// =============================================================================


app.listen(port);
console.log('Magic happens on port ' + port);

// vim: fdm=marker
