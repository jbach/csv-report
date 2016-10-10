'use strict';
const fs = require('fs');
const pdf = require('html-pdf');
const handlebars = require('handlebars');
const _ = require('lodash');

handlebars.registerHelper('hours', seconds => seconds / 3600);

handlebars.registerHelper('date', function(){
	return this.date.format('L');
});

handlebars.registerHelper('task', function(){
	return this.task.join('; ');
});

const renderHTML = (report, includeProjects, cb) => {
	let data = report.data;

	// reduce dataset if parameter is array, otherwise include all
	if(includeProjects && _.isArray(includeProjects) && includeProjects.length > 0 && !_.contains(includeProjects, 'all')){
		report.log('reducing to following projects: ', includeProjects);
		data = _.filter(data, function(project){
			return _.contains(includeProjects, project.project);
		});
	}

	report.log('reading template from: ', report.options.template);

	fs.readFile(report.options.template, 'utf8', (err, template) => {
		if(err){
			return cb(err);
		}
		cb(null, handlebars.compile(template)({
			projects: data
		}));
	});
};

const renderPDF = (report, content, cb) => {
	report.log('rendering PDF');

	pdf.create(content, report.options.paperSize).toFile(report.options.out, err => {
		if(err){
			cb(err);
			return report.error(err);
		}

		cb(null, report.options.out);
		report.log('rendering done');
	});
};

const render = (report, includeProjects, cb) => {
	renderHTML(report, includeProjects, (err, html) => {
		if (err){
			cb(err);
			return report.error(err);
		}
		renderPDF(report, html, (pdfErr, file) => {
			if (pdfErr){
				cb(err);
				return report.error(err);
			}
			cb(null, file);
			report.emit('done', file);
		});
	});

	return report;
};

module.exports = render;
