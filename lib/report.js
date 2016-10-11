'use strict';
const EventEmitter = require('events').EventEmitter;
const moment = require('moment');
const _ = require('lodash');
const getOptions = require('./options').getOptions;
const render = require('./render');
const parse = require('./parse');

class csvReport extends EventEmitter{
	constructor(opts){
		super();

		// set options
		this.options = getOptions(opts);

		// set moments locale (todo: check if this needs to go to render)
		moment.locale(this.options.lang);
	}

	log(msg){
		this.emit('log', msg);
	}

	getData(){
		if(typeof this.data !== 'undefined'){
			return Promise.resolve(this.data);
		}

		return parse(this.options, this.log.bind(this))
			.then(data => {
				this.data = data;
				return data;
			});
	}

	getProjects(){
		return this.getData().then(data => _.map(data, 'project'));
	}

	getEntries(project){
		return this.getData()
			.then(data => {
				if(!project){
					return data;
				}

				project = data.find(p => p.project === project);

				return project ? project.entries : [];
			});
	}

	render(includeProjects){
		return this.getData().then(() => render(this.data, includeProjects, this.options, this.log.bind(this)));
	}
}

module.exports = csvReport;
