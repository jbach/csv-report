'use strict';
const path = require('path');
const moment = require('moment');

const defaults = {
	out: path.resolve(__dirname, '../'),
	start: moment().subtract(1, 'month').startOf('month'),
	end: moment().subtract(1, 'month').endOf('month'),
	delim: ';',
	round: 15,
	template: path.resolve(__dirname, './template.html'),
	lang: 'en',
	mappings: {
		date: 'Date',
		project: 'Project',
		task: 'Task',
		duration: 'Duration',
		start: 'Start',
		end: 'End',
		custom: {
			comment: 'Comment'
		}
	},
	dateFormat: ['MM-DD-YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'],
	startFormat: ['YYYY-MM-DD HH:mm:ss'],
	endFormat: ['YYYY-MM-DD HH:mm:ss'],
	paperSize: {
		format: 'A4',
		orientation: 'portrait',
		border: '1.5cm'
	}
};

const getOptions = opts => {
	const options = Object.assign({}, defaults, opts);

	// init moments
	if(!moment.isMoment(options.start)){
		options.start = moment(options.start, options.dateFormat);
	}

	if(!moment.isMoment(options.end)){
		options.end = moment(options.end, options.dateFormat);
	}

	// check for output path
	if(path.extname(options.out) !== '.pdf'){
		const filename = 'report-' + options.start.format('MMM-YY') + '.pdf';
		options.out = path.join(options.out, filename);
	}

	return options;
};

module.exports.getOptions = getOptions;
module.exports.defaults = defaults;
