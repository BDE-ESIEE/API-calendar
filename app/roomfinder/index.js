var _      = require('lodash');
var jf     = require('jsonfile');
var debug  = require('debug')('app:roomfinder');
var moment = require('moment');

roomfinder = {
	config: require('../../config.json')
}

roomfinder.availableRooms = jf.readFileSync("rooms.json").rooms;

roomfinder.findRoomNow = function(callback) {
	roomfinder.findRoom(moment(), callback);
}

roomfinder.findRoom = function(date, callback) {

	debug("Finding occupied rooms at " + date.toDate().toString());

	var safeguard = date.add(roomfinder.config.roomTimeSafeguard, 'minutes');

	return roomfinder.Activity.find({
		start: {
			$lte: safeguard.toDate()
		},
		end: {
			$gt: date.toDate()
		}
	}, {_id:0,__v:0}, function(err, activities) {
		if(err) {
			console.error(err);
			callback(err, null);
			return;
		}

		var occupiedRooms = _.flatten(
			_.map(activities, function(activity) {
				return activity.rooms;
			});
		);

		// Substract it from the list of available rooms
		callback(null, _.difference(roomfinder.availableRooms, occupiedRooms));
	});
}

module.exports = function(Activity) {
	roomfinder.Activity = Activity;
	return {
		'findRoom'   : roomfinder.findRoom,
		'findRoomNow': roomfinder.findRoomNow
	};
}
