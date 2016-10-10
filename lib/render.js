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

const renderHTML = (report, includeProjects) => {
	let data = report.data;

	// reduce dataset if parameter is array, otherwise include all
	if(includeProjects && _.isArray(includeProjects) && includeProjects.length > 0 && !_.includes(includeProjects, 'all')){
		report.log('reducing to following projects: ', includeProjects);
		data = _.filter(data, project => _.includes(includeProjects, project.project));
	}

	report.log('reading template from: ', report.options.template);

	return readFile(report.options.template, 'utf8').then(template => handlebars.compile(template)({ projects: data }));
};

const renderPDF = (report, html) => {
	report.log('rendering PDF');
	const pdfReport = pdf.create(html, report.options.paperSize);
	return denodeify(pdfReport.toFile.bind(pdfReport))(report.options.out)
		.then((res) => `Rendering done. File saved under ${res.filename}`);
};

const render = (report, includeProjects) => {
	return renderHTML(report, includeProjects).then(html => renderPDF(report, html));
};

module.exports = render;
