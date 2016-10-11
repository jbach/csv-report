'use strict';
const denodeify = require('denodeify');
const readFile = denodeify(require('fs').readFile);
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

const renderHTML = (data, includeProjects, options, log) => {
	// reduce dataset if parameter is array, otherwise include all
	if(includeProjects && _.isArray(includeProjects) && includeProjects.length > 0 && !_.includes(includeProjects, 'all')){
		log('reducing to following projects: ', includeProjects);
		data = _.filter(data, project => _.includes(includeProjects, project.project));
	}

	log('reading template from: ', options.template);

	return readFile(options.template, 'utf8').then(template => handlebars.compile(template)({ projects: data }));
};

const renderPDF = (html, options, log) => {
	log('rendering PDF');
	const pdfReport = pdf.create(html, options.paperSize);
	return denodeify(pdfReport.toFile.bind(pdfReport))(options.out)
		.then((res) => `Rendering done. File saved under ${res.filename}`);
};

const render = (data, includeProjects, options, log = () => {}) => {
	return renderHTML(data, includeProjects, options, log).then(html => renderPDF(html, options, log));
};

module.exports = render;
