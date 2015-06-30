var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var ActivitySchema = new Schema({
    name : String,
    rooms: [String],
    start: Date,
    end  : Date
});

module.exports = mongoose.model('Activity', ActivitySchema);
