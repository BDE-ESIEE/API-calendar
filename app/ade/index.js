var ical  = require('ical');
var _     = require('lodash');
var debug = require('debug')('app:cache');

var ade = {
	config: require('../../config.json')
}

ade.processCache = function(err, data) {
	if(err)
		console.error(err);

	debug("Removing previous cache.");
	ade.clearCache();

	debug("Populating cache.");
	ade.populateCache(data);
	debug("Done.");
}

ade.refreshRoomsCache = function() {
	debug("Getting the data.");
	if(ade.config.parseFromFile) {
		ade.processCache(null, ical.parseFile(ade.config.icalFilename));
	} else {
		ical.fromURL(
			ade.config.icalURL,
			{},
			ade.processCache
		);
	}
}

ade.clearCache = function() {
	ade.Activity.remove({}, function(err, activity) {
		if(err)
			console.error(err);
	});
}

ade.populateCache = function(data) {
	_.each(data, function(event) {
		// Remove edge cases were it is an uninteresting event
		if(ade.isSpecialRoom(event.location)) {
			debug('Ommiting event in "' + event.location + '"');
		} else {
			ade.saveEvent(event);
		}
	});

	// For testing:

	//ade.saveEvent({summary: 'SFM-2003:CTRL',  location: ''});
	//ade.saveEvent({summary: 'IGE-3002:CTRL',  location: ''});
	//ade.saveEvent({summary: 'MSH-5102D:CTRL', location: ''});
	//ade.saveEvent({summary: 'INF-4101B:CTRL', location: ''});
	//ade.saveEvent({summary: 'SI-4101A:CTRL',  location: ''});
	//ade.saveEvent({summary: 'LV1-2001:CTRL',  location: ''});
	//ade.saveEvent({summary: 'IGE-1001:CTRL',  location: ''});
	//ade.saveEvent({summary: 'EN5A11A:CTRL',   location: ''});
	//ade.saveEvent({summary: 'EL5E12:CTRL',    location: ''});
}

ade.isSpecialRoom = function(location) {
	return ade.config.locationIgnore.indexOf(location) > -1;
}

ade.saveEvent = function(event) {
	var activity = new ade.Activity();

	activity.name        = event.summary;
	activity.rooms       = ade.getRooms(event.location);
	activity.start       = event.start;
	activity.end         = event.end;
	activity.description = event.description;

	activity.save(function(err) {
		if(err)
			console.error(err);
	});
}

ade.getRooms = function(location) {
	// Location is a csv list, eg "2101,0112,5402V,1301+"
	var rooms = location.split(",");
	rooms = _.map(rooms, function(room) {
		// Strip the room name from any trailing V or +
		// Ugly but I don't see any alternative
		return room.split('+')[0].split('V')[0];
	});
	return rooms;
}

module.exports = function(Activity) {
	ade.Activity = Activity;
	return {'refreshRoomsCache': ade.refreshRoomsCache};
}
