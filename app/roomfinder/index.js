var _     = require('lodash');
var jf    = require('jsonfile');
var chalk = require('chalk');

roomfinder = {}

roomfinder.availableRooms = jf.readFileSync("rooms.json").rooms;

var roomfinderLogPrefix = chalk.bold.underline('[Room Finder]') + " ";

roomfinder.findRoomNow = function(callback) {
	roomfinder.findRoom(new Date(), callback);
}

roomfinder.findRoom = function(date, callback) {

	console.log(roomfinderLogPrefix + "Finding occupied rooms at " + date.toString());
	return roomfinder.Activity.find({
		start: {
			$lte: date
		},
		end: {
			$gt: date
		}
	}, {_id:0,__v:0}, function(err, activities) {
		if(err)
			console.error(err);

		var occupiedRooms = _.flatten(
			_.map(activities, function(activity) {
				return activity.rooms;
			})
		);

		// Substract it from the list of available rooms
		callback(_.difference(roomfinder.availableRooms, occupiedRooms));
	});
}

module.exports = function(Activity) {
	roomfinder.Activity = Activity;
	return {
		'findRoom'   : roomfinder.findRoom,
		'findRoomNow': roomfinder.findRoomNow
	};
}
