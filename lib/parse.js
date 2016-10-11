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
const transformEntry = (row, options, log) => {
	const keys = options.mappings;

	// build proper model
	const entry = {
		custom: {},
		project: row[keys.project] || '',
		task: row[keys.task] || ''
	};

	// log shortcut
	const entryLog = msg => log(`Entry (${entry.project}: ${entry.task}): ${msg}`);

	// set date
	if(keys.date && row[keys.date]){
		entry.date = moment(row[keys.date], options.dateFormat);
	}else if(keys.start && row[keys.start]){
		entry.date = moment(row[keys.start], options.startFormat).startOf('day');
	}else{
		entryLog('Does not have date or start field and is ignored');
		return null;
	}

	// valid date?
	if(!entry.date.isValid()){
		entryLog('Date could not be parsed');
		return null;
	}

	// is entry within timeframe?
	if(options.start.isAfter(entry.date) || options.end.isBefore(entry.date)){
		entryLog('Is not within timeframe');
		return null;
	}

	// set duration
	if(keys.duration && row[keys.duration]){
		entry.duration = castDuration(row[keys.duration]);
	}else if(keys.start && keys.end && row[keys.start] && row[keys.end]){
		const start = moment(row[keys.start], options.startFormat);
		const end = moment(row[keys.end], options.endFormat);
		entry.duration = end.diff(start, 'seconds');
	}else{
		entryLog('Does not have duration or start/end field and is ignored');
		return null;
	}

	// valid duration?
	if(entry.duration === 0){
		entryLog('Duration equals 0');
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
const processEntries = (data, options, log) => {
	// transform each entry
	data = data
		.map(el => transformEntry(el, options, log))
		.filter(el => el !== null);

	const count = data.length;
	log(`read and parse done. ${count} total entries`);

	if(count === 0){
		log(`No entries lie within ${options.start.format('l')} and ${options.end.format('l')}`);
	}

	// sort by date
	data = _.sortBy(data, entry => entry.date.unix());

	// group by project
	data = _.groupBy(data, 'project');

	log(`${count} entries were split among ${Object.keys(data).length} projects`);

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
			dayEntries.duration = Math.ceil(dayEntries.duration / (options.round * 60)) * options.round * 60;

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
module.exports = function(options, log = () => {}){
	log('read and parse ' + options.file);
	return readFile(options.file, 'utf8')
		// parse csv
		.then(text => parseCsv(text, {
			delimiter: options.delim,
			columns: true
		}))
		// process data
		.then(data => processEntries(data, options, log));
};
