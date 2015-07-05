var ical  = require('ical');
var _     = require('lodash');
var chalk = require('chalk');

var ade = {}

var cacheLogPrefix = chalk.bold.underline("[Cache]") + " ";

ade.refreshRoomsCache = function() {
	console.log(cacheLogPrefix + "Getting the data.");
	ical.fromURL(
		"https://planif.esiee.fr:8443/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=682,683,684,685,772,719,2841,2556,2112,749,183,185,196,4051,4679,2072,2074,2272,2276,2089,154,700,713,737,774,163,167,701,705,707,708,712,714,715,716,724,725,726,758,759,1057,1858,1908,2090,2108,2281,717,720,721,722,2265,2274,2279,2842&projectId=4&calType=ical&nbWeeks=4",
		{},
		function(err, data) {
			if(err)
				console.error(err);

			console.log(cacheLogPrefix + "Removing previous cache.");
			ade.clearCache();

			console.log(cacheLogPrefix + "Populating cache.");
			ade.populateCache(data);
			console.log(cacheLogPrefix + "Done.");
		}
	);
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
		if(event.location == "M.D."
		   || event.location == "05-Examens-si-multi classes"
		   || event.location == "04-Examens") {
			console.warn(cacheLogPrefix + 'Ommiting event in "' + event.location + '"');
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
