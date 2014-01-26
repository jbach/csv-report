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

	// validate / parse entries from csv
	util.transformEntry = function(row, index){
		// build proper model
		var entry = {
			custom: {}
		};

		entry.project = row[keys.project] || '';
		entry.task = row[keys.task] || '';
		
		// set date
		if(keys.date && row[keys.date]){
			entry.date = moment(row[keys.date], main.options.dateFormat);
		}else if(keys.start && row[keys.start]){
			entry.date = moment(row[keys.start], main.options.startFormat).startOf('day');
		}else{
			main.log('Entry (' + entry.project + ': ' + entry.task + '): Does not have date or start field and is ignored');
			return null;
		}

		// valid date?
		if(!entry.date.isValid()){
			main.log('Entry (' + entry.project + ': ' + entry.task + '): Date could not be parsed');
			return null;
		}

		// is entry within timeframe?
		if(main.options.start.isAfter(entry.date) || main.options.end.isBefore(entry.date)){
			main.log('Entry (' + entry.project + ': ' + entry.task + '): Is not within timeframe');
			return null;
		}

		// set duration 
		if(keys.duration && row[keys.duration]){
			entry.duration = util.castDuration(row[keys.duration]);
		}else if(keys.start && keys.end && row[keys.start] && row[keys.end]){
			var start = moment(row[keys.start], main.options.startFormat);
			var end = moment(row[keys.end], main.options.endFormat);
			entry.duration = end.diff(start, 'seconds');
		}else{
			main.log('Entry (' + entry.project + ': ' + entry.task + ') does not have duration or start/end field and is ignored');
			return null;
		}

		// valid duration?
		if(entry.duration === 0){
			main.log('Entry (' + entry.project + ': ' + entry.task + '): Duration equals 0');
			return null;
		}

		// custom fields
		if(typeof keys.custom === 'object' && keys.custom !== null){
			for (var prop in keys.custom) {
				if(keys.custom.hasOwnProperty(prop) && row[keys.custom[prop]]){
					entry.custom[prop] = row[keys.custom[prop]];
				}
			}
		}

		return entry;
	};

	return util;
};