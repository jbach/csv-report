var moment = require('moment'),
	csv = require('csv'),
	_ = require('underscore');

var util = require('./util');

module.exports = function(main){
	var keys = main.options.mappings;
	util = util(main);

	var processEntries = function(data, count) {
		main.log('read and parse done. ' + count + ' total entries');

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
					var duration = util.castDuration(entry[keys.duration]);
					
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

		// convert object to arrays (todo: move this to render)
		//data = _.values(data);
		
		// handover data and trigger done event
		main.data = data;
		main.emit('processDataDone', main.data);
	};


	// read from .csv file, transform and convert data to object
	main.log('read and parse ' + main.options.file);
	csv()
		.from.path(main.options.file, {
			delimiter: main.options.delim,
			columns: true
		})
		.to.array(processEntries)
		.transform(util.transformEntry)
		.on('error', function(err){
			main.error(err);
		});
};