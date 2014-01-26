var path = require('path'),
	moment = require('moment'),
	_ = require('underscore');

var defaultOptions = {
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
	dateFormat: ['MM-DD-YYYY', 'YYYY-MM-DD'],
	startFormat: ['YYYY-MM-DD HH:mm:ss'],
	endFormat: ['YYYY-MM-DD HH:mm:ss'],
	paperSize: {
		format: 'A4',
		orientation: 'landscape',
		border: '1.5cm'
	}
};

module.exports = function(opts){
	var options = _.defaults(opts, defaultOptions);
	
	// init moments
	if(options.start){
		options.start = moment(options.start);
	}else{
		options.start = moment().subtract('month', 1).startOf('month');
	}

	if(options.end){
		options.end = moment(options.end);
	}else{
		options.end = moment().subtract('month', 1).endOf('month');
	}

	return options;
};