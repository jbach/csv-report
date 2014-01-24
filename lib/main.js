var util = require('util'),
	events = require('events'),
	_ = require('underscore'),
	defaultOptions = {
		file:''
	};

var csvReport = function(){
	events.EventEmitter.call(this);
};

util.inherits(csvReport, events.EventEmitter);
var p = csvReport.prototype;

p.init = function(options){
	this.options = _.defaults(options, defaultOptions);
	this.emit('done', 'Hooray!');
};

module.exports = new csvReport();