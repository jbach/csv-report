var moment = require('moment');
	
module.exports = function(main){
	var keys = main.options.mappings;
	var util = {};

	// parses a string and returns seconds ('1:35:30' -> 5730)
	// todo: move this to entry validation / scheme
	util.castDuration = function(duration){
		duration = duration.split(':');
		return moment.duration({hours:duration[0],minutes:duration[1],seconds:duration[2]}).asSeconds();
		//return parseInt(duration[0], 10) * 3600 + parseInt(duration[1], 10) * 60 + parseInt(duration[2], 10);
	};

	util.transformEntry = function(row, index){
		// is entry within timeframe?
		if(main.options.start.isAfter(row[keys.date]) || main.options.end.isBefore(row[keys.date])){
			return null;
		}

		return row;
	};

	return util;
};