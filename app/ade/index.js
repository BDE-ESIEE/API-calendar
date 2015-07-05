var ical  = require('ical');
var _     = require('lodash');
var chalk = require('chalk');

var ade = {}

var cacheLogPrefix = chalk.bold.underline("[Cache]") + " ";

ade.refreshRoomsCache = function() {
	console.log(cacheLogPrefix + "Getting the data.");
	ical.fromURL(
		"https://planif.esiee.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=682,683,684,685,772,2112,2841,719,2556,2842,183,185,196,4051,4679,749,737,154,713,700,1057,724,1858,705,2281,1908,758,707,708,759,712,714,2090,2108,725,726,701,715,716,163,167,2276,2272,2072,2074,2089,2274,2279,2265,717,720,721,722,745,704,746,747,748,3286,2781,2782,2117,728,2282,2270,2277,2278,2275,789,790,786,787,788,1852,780,4350,740,782,2584,742,741,731,732,734,736,735,674,998,727,733,680,659,665,2555,1295,5215,681,785,5321,744,739,743,738,773,4937,775,776,147,3132,2907,2909,2911,2908,3134,2353,2844,2910,1135,2899,2912,2904,2905,2902,3129,2913,2898,2901,2007,3135,2903,1892,68,2273,2261,2703,2262,833,752,777,767,2031,779,1987,300,1861,1439,1357,2354,2573,90,686,1727,1578,65,590,1579,778&projectId=0&calType=ical&nbWeeks=12",
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
