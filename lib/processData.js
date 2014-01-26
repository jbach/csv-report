var moment = require('moment'),
	csv = require('csv'),
	_ = require('underscore');

module.exports = function(main){
	var keys = main.options.mappings;

	// parses a string and returns seconds ('1:35:30' -> 5730)
	var castDuration = function(duration){
		duration = duration.split(':');
		return moment.duration({hours:duration[0],minutes:duration[1],seconds:duration[2]}).asSeconds();
		//return parseInt(duration[0], 10) * 3600 + parseInt(duration[1], 10) * 60 + parseInt(duration[2], 10);
	};

	// modify single entry
	var transformEntry = function(row, index){
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
			entry.duration = castDuration(row[keys.duration]);
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

	// validate / parse entries from csv
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

		// cleanup data
		data = _.map(data, function(entries, project){
			return {
				project: project,
				entries: entries,
				total: _.reduce(entries, function(memo, entry){ return memo + entry.duration; }, 0)
			};
		});
		
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
		.transform(transformEntry)
		.on('error', function(err){
			main.error(err);
		});
};