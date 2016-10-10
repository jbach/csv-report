'use strict';
const moment = require('moment');
const denodeify = require('denodeify');
const readFile = denodeify(require('fs').readFile);
const parseCsv = denodeify(require('csv').parse);
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
		custom: {},
		project: row[keys.project] || '',
		task: row[keys.task] || ''
	};

	// log shortcut
	const log = msg => report.log(`Entry (${entry.project}: ${entry.task}): ${msg}`);

	// set date
	if(keys.date && row[keys.date]){
		entry.date = moment(row[keys.date], report.options.dateFormat);
	}else if(keys.start && row[keys.start]){
		entry.date = moment(row[keys.start], report.options.startFormat).startOf('day');
	}else{
		log('Does not have date or start field and is ignored');
		return null;
	}

	// valid date?
	if(!entry.date.isValid()){
		log('Date could not be parsed');
		return null;
	}

	// is entry within timeframe?
	if(report.options.start.isAfter(entry.date) || report.options.end.isBefore(entry.date)){
		log('Is not within timeframe');
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
		log('Does not have duration or start/end field and is ignored');
		return null;
	}

	// valid duration?
	if(entry.duration === 0){
		report.log('Duration equals 0');
		return null;
	}

	// custom fields
	Object.keys(keys.custom || {}).forEach(key => {
		if(row[keys.custom[key]]){
			entry.custom[key] = row[keys.custom[key]];
		}
	});

	return entry;
};


// further processing / grouping of parsed entries
const processEntries = (data, report) => {
	// transform each entry
	data = data
		.map(el => transformEntry(el, report))
		.filter(el => el !== null);

	const count = data.length;
	report.log(`read and parse done. ${count} total entries`);

	if(count === 0){
		report.log(`No entries lie within ${report.options.start.format('l')} and ${report.options.end.format('l')}`);
	}

	// sort by date
	data = _.sortBy(data, entry => entry.date.unix());

	// group by project
	data = _.groupBy(data, 'project');

	report.log(`${count} entries were split among ${Object.keys(data).length} projects`);

	// merge every days entries by task description

	// for every project…
	Object.keys(data).forEach(projectName => {
		// …group entries by day…
		const entries = _.groupBy(data[projectName], entry => entry.date.unix());

		// …now for each day…
		data[projectName] = _.map(entries, dayEntries => {
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
				duration: 0,
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
	report.log('read and parse ' + report.options.file);
	return readFile(report.options.file, 'utf8')
		// parse csv
		.then(text => parseCsv(text, {
			delimiter: report.options.delim,
			columns: true
		}))
		// process data
		.then(data => processEntries(data, report));
};
