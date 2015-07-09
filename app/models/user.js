var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var UserSchema = new Schema({
	googleId    :  String,
	googleToken :  String,
	name        :  String,
	email       :  String,
	clubs       : [Number],
	adminClubs  : [Number]
});

module.exports = mongoose.model('User', UserSchema);
