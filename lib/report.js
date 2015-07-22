var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var moment = require('moment');
var _ = require('lodash');
var options = require('./options').getOptions;
var render = require('./render');
var parse = require('./parse');

var csvReport = function(opts){
	EventEmitter.call(this);

	// set options
	this.options = options(opts);

	// set moments locale (todo: check if this needs to go to render)
	moment.locale(this.options.lang);
};

inherits(csvReport, EventEmitter);
var p = csvReport.prototype;

// parse the file, set this.data and fire parseDone when finished
p.parse = function(){
	parse(this);
	return this;
};

// render data to html, then PDF
p.render = function(includeProjects, cb){
	if ((!cb || typeof cb != "function")) {
		if(typeof includeProjects === 'function'){
			cb = includeProjects;
			includeProjects = undefined;
		}else{
			cb = function(){};
		}
	}

	if(typeof this.data === 'undefined'){
		main.once('processDataDone', _.bind(this.render, this, includeProjects, cb));
		return this;
	}

	render(includeProjects, this);

	return this;
};

p.getProjects = function(cb){
	if (!cb || typeof cb != "function"){
		cb = function(){};
	}

	// wait for data
	if(typeof this.data === 'undefined'){
		this.once('parseDone', _.bind(this.getProjects, this, cb));
		return this;
	}

	cb(null, _.pluck(this.data, 'project'));

	return this;
};

p.getEntries = function(project, cb){
	// wait for data
	if(typeof this.data === 'undefined'){
		this.once('parseDone', _.bind(this.getEntries, this, project, cb));
		return this;
	}

	if (!cb || typeof cb != "function") {
		cb = project;
		project = undefined;
		if (!cb || typeof cb != "function"){
			cb = function(){};
		}
	}

	if(!project){
		cb(null, this.data);
		return this;
	}

	project = _.findWhere(this.data, {project: project});

	cb(null, project? project.entries : []);
	
	return this;
};

p.error = function(err){
	this.emit('error', err);
};

p.log = function(msg){
	this.emit('log', msg);
};

module.exports = csvReport;