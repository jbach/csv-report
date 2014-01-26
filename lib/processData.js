var async = require('async'),
	moment = require('moment'),
	csv = require('csv'),
	_ = require('underscore');

// parses a string and returns seconds ('1:35:30' -> 5730)
// todo: move this to entry validation / scheme
var castDuration = function(duration){
	duration = duration.split(':');
	return moment.duration({hours:duration[0],minutes:duration[1],seconds:duration[2]}).asSeconds();
	//return parseInt(duration[0], 10) * 3600 + parseInt(duration[1], 10) * 60 + parseInt(duration[2], 10);
};

module.exports = function(main){
	var keys = main.options.mappings;

	var process = function(data, count) {
		var initialCount = count;

		main.log('read and parse done. ' + count + ' total entries');

		if(count === 0){
			return main.error('No entries in file');
		}

		// reduce by given timeframe
		data = _.filter(data, function(entry){
			return main.options.start.isBefore(entry[keys.date]) && main.options.end.isAfter(entry[keys.date]);
		});

		// recount entries
		count = _.size(data);

		main.log(count + '/' + initialCount + ' entries lie within ' + main.options.start.format('l') + ' and ' + main.options.end.format('l'));

		if(count === 0){
			return main.error('No entries lie within ' + main.options.start.format('l') + ' and ' + main.options.end.format('l'));
		}

		// sort by date
		data = _.sortBy(data, keys.date);

		// group by project
		data = _.groupBy(data, keys.project);

		var projectCount = _.size(data);

		main.log(count + ' entries were split among ' + projectCount + ' projects');

	
		// merge every day's entries by task description
		
		// for every project…
		_.each(data, function(entries, projectName, list){
			// …group entries by day…
			entries = _.groupBy(entries, keys.date);
			
			// …now for each day…
			list[projectName] = _.map(entries, function(dayEntries, dayGroup){
				// …merge entries!
				dayEntries = _.reduce(dayEntries, function(memo, entry){
					memo.Task.push(entry[keys.task]);
					memo.Task = _.uniq(memo.Task);
					
					// cast duration
					var duration = castDuration(entry[keys.duration]);
					
					// round up by given interval
					memo.Duration += (Math.ceil(duration / main.options.round) * main.options.round);
					
					return memo;
				}, {
					Project:projectName,
					Date:moment(dayGroup),
					Duration:0, // seconds
					Task:[],
					//Comment:''
				});
				return dayEntries;
			});
		});

		// convert object to arrays
		//data = _.values(data);
		
		// handover data and trigger done event
		main.data = data;
		main.emit('processDataDone', main.data);
	};


	// read from .csv file and convert data to object
	main.log('read and parse ' + main.options.file);
	csv()
		.on('error', function(err){
			main.error(err);
		})
		.from.path(main.options.file, {
			delimiter: main.options.delim,
			columns: true
		})
		.to.array(process);
};