'use strict';
const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;
const moment = require('moment');
const _ = require('lodash');
const options = require('./options').getOptions;
const render = require('./render');
const parse = require('./parse');

const csvReport = function(opts){
	EventEmitter.call(this);

	// set options
	this.options = options(opts);

	// set moments locale (todo: check if this needs to go to render)
	moment.locale(this.options.lang);
};

inherits(csvReport, EventEmitter);
const p = csvReport.prototype;

// delay method f until parsing is done
p.delayMethod = function(f, args){
	const _this = this;

	this.once('parseDone', function(){
		f.apply(_this, args);
	});

	if(!this.isParsing){
		this.isParsing = true;
		parse(this);
	}
};

// render data to html, then PDF
p.render = function(includeProjects, cb){
	// wait for data
	if(typeof this.data === 'undefined'){
		this.delayMethod(this.render, arguments);
		return this;
	}

	if ((!cb || typeof cb !== 'function') && typeof includeProjects === 'function'){
		cb = includeProjects;
		includeProjects = undefined;
	}

	if (!cb || typeof cb !== 'function'){
		cb = function(){};
	}

	render(this, includeProjects, cb);

	return this;
};

p.getProjects = function(cb){
	// wait for data
	if(typeof this.data === 'undefined'){
		this.delayMethod(this.getProjects, arguments);
		return this;
	}

	if (!cb || typeof cb !== 'function'){
		cb = function(){};
	}

	cb(null, _.pluck(this.data, 'project'));

	return this;
};

p.getEntries = function(project, cb){
	// wait for data
	if(typeof this.data === 'undefined'){
		this.delayMethod(this.getEntries, arguments);
		return this;
	}

	if (!cb || typeof cb !== 'function'){
		cb = project;
		project = undefined;
		if (!cb || typeof cb !== 'function'){
			cb = function(){};
		}
	}

	if(!project){
		cb(null, this.data);
		return this;
	}

	project = _.findWhere(this.data, { project: project });

	cb(null, project ? project.entries : []);

	return this;
};

p.error = function(err){
	this.emit('error', err);
};

p.log = function(msg){
	this.emit('log', msg);
};

module.exports = csvReport;
