// external modules
var util = require('util'),
	path = require('path'),
	events = require('events'),
	moment = require('moment'),
	_ = require('underscore');

// internal modules
var processData = require('./processData');

var defaultOptions = {
	delim: ';',
	round: 15,
	template: path.resolve(__dirname, './template.html'),
	lang: 'en',
	mappings: {
		date: 'Date',
		project: 'Project',
		task: 'Task',
		duration: 'Duration'
	}
};

var csvReport = function(options){
	events.EventEmitter.call(this);
	this.options = _.defaults(options, defaultOptions);

	// init moments
	if(this.options.start){
		this.options.start = moment(this.options.start);
	}else{
		this.options.start = moment().subtract('month', 1).startOf('month');
	}

	if(this.options.end){
		this.options.end = moment(this.options.end);
	}else{
		this.options.end = moment().subtract('month', 1).endOf('month');
	}

	// set moments lang
	moment.lang(this.options.lang);

	// parse the file, set this.data and raise processDataDone when finished
	processData(this);
};

util.inherits(csvReport, events.EventEmitter);
var p = csvReport.prototype;

p.doThat = function(foo){
	// wait for data
	if(typeof this.data === 'undefined'){
		this.once('processDataDone', _.bind(this.doThat, this, foo));
		return this;
	}
	this.emit('task', 'this.data is now set.');
	return this;
};

p.error = function(err){
	this.emit('error', err);
};

p.log = function(msg){
	this.emit('log', msg);
};

module.exports = csvReport;