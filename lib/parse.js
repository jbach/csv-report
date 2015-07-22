var moment = require('moment');
var fs = require('fs');
var csv = require('csv');
var _ = require('lodash');

// parse a string and return seconds ('1:35:30' -> 5730)
var castDuration = function(duration){
	duration = duration.split(':');
	return moment.duration({hours:duration[0],minutes:duration[1],seconds:duration[2]}).asSeconds();
};

// modify single entry
var transformEntry = function(row, report){
	var keys = report.options.mappings;

	// build proper model
	var entry = {
		custom: {}
	};

	entry.project = row[keys.project] || '';
	entry.task = row[keys.task] || '';
	
	// set date
	if(keys.date && row[keys.date]){
		entry.date = moment(row[keys.date], report.options.dateFormat);
	}else if(keys.start && row[keys.start]){
		entry.date = moment(row[keys.start], report.options.startFormat).startOf('day');
	}else{
		report.log('Entry (' + entry.project + ': ' + entry.task + '): Does not have date or start field and is ignored');
		return null;
	}

	// valid date?
	if(!entry.date.isValid()){
		report.log('Entry (' + entry.project + ': ' + entry.task + '): Date could not be parsed');
		return null;
	}

	// is entry within timeframe?
	if(report.options.start.isAfter(entry.date) || report.options.end.isBefore(entry.date)){
		report.log('Entry (' + entry.project + ': ' + entry.task + '): Is not within timeframe');
		return null;
	}

	// set duration 
	if(keys.duration && row[keys.duration]){
		entry.duration = castDuration(row[keys.duration]);
	}else if(keys.start && keys.end && row[keys.start] && row[keys.end]){
		var start = moment(row[keys.start], report.options.startFormat);
		var end = moment(row[keys.end], report.options.endFormat);
		entry.duration = end.diff(start, 'seconds');
	}else{
		report.log('Entry (' + entry.project + ': ' + entry.task + ') does not have duration or start/end field and is ignored');
		return null;
	}

	// valid duration?
	if(entry.duration === 0){
		report.log('Entry (' + entry.project + ': ' + entry.task + '): Duration equals 0');
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


// further processing / grouping of parsed entries
var processEntries = function(data, report) {
	var count = data.length;
	report.log('read and parse done. ' + count + ' total entries');

	if(count === 0){
		report.log('No entries lie within ' + report.options.start.format('l') + ' and ' + report.options.end.format('l'));
	}

	// sort by date
	data = _.sortBy(data, function(entry){
		return entry.date.unix();
	});

	// group by project
	data = _.groupBy(data, 'project');

	var projectCount = _.size(data);

	report.log(count + ' entries were split among ' + projectCount + ' projects');


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
				
				memo.duration += entry.duration;
				
				return memo;
			}, {
				project: projectName,
				date: _.first(dayEntries).date,
				duration: 0, // seconds
				task:[]
			});

			// round up by given interval
			dayEntries.duration = (Math.ceil(dayEntries.duration / (report.options.round * 60)) * report.options.round * 60);
			
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

	return data;
};

// read from .csv file, transform and convert data to object
module.exports = function(report){
	var data = [];

	var parser = csv.parse({
		delimiter: report.options.delim,
		columns: true
	});

	var transformer = csv.transform(_.partialRight(transformEntry, report));
	
	report.log('read and parse ' + report.options.file);
	
	// read file
	fs.createReadStream(report.options.file, {encoding: 'utf8'})
		.on('error', function(err){report.error(err.message);})
		// parse file
		.pipe(parser)
		.on('error', function(err){report.error(err.message);})
		// clean up rows
		.pipe(transformer)
		.on('error', function(err){report.error(err.message);})
		.on('readable', function(){
			while(row = this.read()){
				data.push(row);
			}
		})
		.on('finish', function(){
			// handover processed data and trigger done event
			report.data = processEntries(data, report);
			report.emit('parseDone', report.data);
		});
};