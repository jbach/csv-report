// external modules
var util = require('util'),
	events = require('events'),
	moment = require('moment'),
	_ = require('underscore');

// internal modules
var options = require('./options');
var render = require('./render');
var processData = require('./processData');

var csvReport = function(opts){
	events.EventEmitter.call(this);

	this.options = options(opts);
	this.render = render(this);
	
	// set moments lang (todo: check if this needs to go to render)
	moment.lang(this.options.lang);

	// parse the file, set this.data and fire processDataDone when finished
	processData(this);
};

util.inherits(csvReport, events.EventEmitter);
var p = csvReport.prototype;

p.getProjects = function(cb){
	// wait for data
	if(typeof this.data === 'undefined'){
		this.once('processDataDone', _.bind(this.getProjects, this, cb));
		return this;
	}
	cb(null, _.keys(this.data));
	return this;
};

p.getEntries = function(project, cb){
	// wait for data
	if(typeof this.data === 'undefined'){
		this.once('processDataDone', _.bind(this.getEntries, this, project, cb));
		return this;
	}

	if (!cb || typeof cb != "function") {
        cb = project;
        project = undefined;
    }

	if(!project){
		cb(null, _.values(this.data));
		return this;
	}

	cb(null, this.data[project] || []);
	return this;
};

p.error = function(err){
	this.emit('error', err);
};

p.log = function(msg){
	this.emit('log', msg);
};

module.exports = csvReport;