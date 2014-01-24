var util = require('util'),
	path = require('path'),
	events = require('events'),
	moment = require('moment'),
	_ = require('underscore'),
	defaultOptions = {
		delim: ';',
		start: moment().subtract('month', 1).startOf('month').format('YYYY-MM-DD'),
		end: moment().subtract('month', 1).endOf('month').format('YYYY-MM-DD'),
		round: 15,
		template: path.resolve(__dirname, './template.html'),
		lang: 'en'
	};

var csvReport = function(){
	events.EventEmitter.call(this);
};

util.inherits(csvReport, events.EventEmitter);
var p = csvReport.prototype;

p.init = function(options){
	this.options = _.defaults(options, defaultOptions);

	// todo: check for valid input & output path
	
	// init moments
	this.options.start = moment(this.options.start);
	this.options.end = moment(this.options.end);

	// set specified language
	moment.lang(this.options.lang);
	this.emit('done', 'Hooray!');
};

module.exports = new csvReport();