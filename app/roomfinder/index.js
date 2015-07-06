var _     = require('lodash');
var jf    = require('jsonfile');
var chalk = require('chalk');

roomfinder = {}

roomfinder.availableRooms = jf.readFileSync("rooms.json").rooms;

var roomfinderLogPrefix = chalk.bold.underline('[Room Finder]') + " ";

roomfinder.findRoomNow = function(res) {
	roomfinder.findRoom(new Date(), res);
}

roomfinder.findRoom = function(date, res) {

	console.log(roomfinderLogPrefix + "Finding occupied rooms at " + date.toString());
	return roomfinder.Activity.find({
		start: {
			$lte: date
		},
		end: {
			$gt: date
		}
	}, function(err, activities) {
		if(err)
			console.error(err);

		var occupiedRooms = _.flatten(
			_.map(activities, function(activity) {
				return activity.rooms;
			})
		);

		// Substract it from the list of available rooms
		res.json(_.difference(roomfinder.availableRooms, occupiedRooms));
	});
}

module.exports = function(Activity) {
	roomfinder.Activity = Activity;
	return {
		'findRoom'   : roomfinder.findRoom,
		'findRoomNow': roomfinder.findRoomNow
	};
}
