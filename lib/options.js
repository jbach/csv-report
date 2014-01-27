var path = require('path'),
	moment = require('moment'),
	_ = require('underscore');

var defaultOptions = function(){
	return {
		out: path.resolve(__dirname, '../report-' + moment().subtract('month', 1).format('MMM-YY') + '.pdf'),
		start: moment().subtract('month', 1).startOf('month'),
		end: moment().subtract('month', 1).endOf('month'),
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
};

var getOptions = function(opts){
	var options = _.defaults(opts, defaultOptions());
	
	// init moments
	if(!moment.isMoment(options.start)){
		options.start = moment(options.start);
	}
	
	if(!moment.isMoment(options.end)){
		options.end = moment(options.end);
	}

	return options;
};

module.exports.getOptions = getOptions;
module.exports.defaultOptions = defaultOptions;