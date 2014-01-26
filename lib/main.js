// external modules
var util = require('util'),
	events = require('events'),
	moment = require('moment'),
	_ = require('underscore');

// internal modules
var options = require('./options');
var processData = require('./processData');

var csvReport = function(opts){
	events.EventEmitter.call(this);
	this.options = options(opts);
	
	// set moments lang (todo: check if this needs to go to render)
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