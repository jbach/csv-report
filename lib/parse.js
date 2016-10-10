'use strict';
const moment = require('moment');
const fs = require('fs');
const csv = require('csv');
const _ = require('lodash');

// parse a string and return seconds ('1:35:30' -> 5730)
const castDuration = duration => {
	duration = duration.split(':');
	return moment.duration({ hours: duration[0], minutes: duration[1], seconds: duration[2] }).asSeconds();
};

// modify single entry
const transformEntry = (row, report) => {
	const keys = report.options.mappings;

	// build proper model
	const entry = {
		custom: {}
	};

	entry.project = row[keys.project] || '';
	entry.task = row[keys.task] || '';

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
		const start = moment(row[keys.start], report.options.startFormat);
		const end = moment(row[keys.end], report.options.endFormat);
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
		for (const prop in keys.custom){
			if(keys.custom.hasOwnProperty(prop) && row[keys.custom[prop]]){
				entry.custom[prop] = row[keys.custom[prop]];
			}
		}
	}

	return entry;
};


// further processing / grouping of parsed entries
const processEntries = (data, report) => {
	const count = data.length;
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

	const projectCount = _.size(data);

	report.log(count + ' entries were split among ' + projectCount + ' projects');


	// merge every day's entries by task description

	// for every project…
	_.each(data, function(entries, projectName, list){
		// …group entries by day…
		entries = _.groupBy(entries, entry => entry.date.unix());

		// …now for each day…
		list[projectName] = _.map(entries, dayEntries => {
			// …merge entries!
			dayEntries = _.reduce(dayEntries, (memo, entry) => {
				// add task to list of tasks
				memo.task.push(entry.task);
				memo.task = _.uniq(memo.task);

				memo.duration += entry.duration;

				return memo;
			}, {
				project: projectName,
				date: _.first(dayEntries).date,
				duration: 0, // seconds
				task: []
			});

			// round up by given interval
			dayEntries.duration = Math.ceil(dayEntries.duration / (report.options.round * 60)) * report.options.round * 60;

			return dayEntries;
		});
	});

	// cleanup data
	data = _.map(data, (entries, project) => ({
		project: project,
		entries: entries,
		total: _.reduce(entries, (memo, entry) => memo + entry.duration, 0)
	}));

	return data;
};

// read from .csv file, transform and convert data to object
module.exports = function(report){
	const data = [];

	const parser = csv.parse({
		delimiter: report.options.delim,
		columns: true
	});

	const transformer = csv.transform(_.partialRight(transformEntry, report));

	report.log('read and parse ' + report.options.file);

	// read file
	fs.createReadStream(report.options.file, { encoding: 'utf8' })
		.on('error', err => report.error(err.message))
		// parse file
		.pipe(parser)
		.on('error', err => report.error(err.message))
		// clean up rows
		.pipe(transformer)
		.on('error', err => report.error(err.message))
		.on('readable', function(row){
			while(row = this.read()){
				data.push(row);
			}
		})
		.on('finish', () => {
			// handover processed data and trigger done event
			report.data = processEntries(data, report);
			report.emit('parseDone', report.data);
		});
};
