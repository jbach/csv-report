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
			main.log('No entries lie within ' + main.options.start.format('l') + ' and ' + main.options.end.format('l'));
		}

		// sort by date
		data = _.sortBy(data, function(entry){
			return entry.date.unix();
		});

		// group by project
		data = _.groupBy(data, 'project');

		var projectCount = _.size(data);

		main.log(count + ' entries were split among ' + projectCount + ' projects');

	
		// merge every day's entries by task description
		
		// for every project…
		_.each(data, function(entries, projectName, list){
			// …group entries by day…
			entries = _.groupBy(entries, function(entry){ return entry.date.unix(); });
			
			// …now for each day…
			list[projectName] = _.map(entries, function(dayEntries, dayGroup){
				// …merge entries!
				dayEntries = _.reduce(dayEntries, function(memo, entry){

					// add task to list of tasks
					memo.task.push(entry.task);
					memo.task = _.uniq(memo.task);
					
					// round up by given interval
					memo.duration += (Math.ceil(entry.duration / main.options.round) * main.options.round);
					
					return memo;
				}, {
					project: projectName,
					date: _.first(dayEntries).date,
					duration: 0, // seconds
					task:[]
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