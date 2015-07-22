var fs = require('fs');
var pdf = require('html-pdf');
var handlebars = require('handlebars');
var _ = require('lodash');

handlebars.registerHelper('hours', function(seconds) {
	return seconds / 3600;
});

handlebars.registerHelper('date', function() {
	return this.date.format('L');
});

handlebars.registerHelper('task', function() {
	return this.task.join('; ');
});

var renderHTML = function(report, includeProjects, cb){
	var data = report.data;

	// reduce dataset if parameter is array, otherwise include all
	if(includeProjects && _.isArray(includeProjects) && includeProjects.length > 0 && !_.contains(includeProjects, 'all')){
		report.log('reducing to following projects: ', includeProjects);
		data = _.filter(data, function(project){
			return _.contains(includeProjects, project.project);
		});
	}

	report.log('reading template from: ', report.options.template);

	fs.readFile(report.options.template, 'utf8', function (err, template) {
		if (err) return cb(err);
		cb(null, handlebars.compile(template)({
			projects: data
		}));
	});
};

var renderPDF = function(report, content, cb){
	report.log('rendering PDF');

	pdf.create(content, report.options.paperSize).toFile(report.options.out, function(err, res){
		if(err){
			cb(err);
			return report.error(err);
		}

		cb(null, report.options.out);
		report.log('rendering done');
	});
};

module.exports = function(report, includeProjects, cb){
	renderHTML(report, includeProjects, function(err, html){
		if (err) {
			cb(err);
			return report.error(err);
		}
		renderPDF(report, html, function(err, file){
			if (err) {
				cb(err);
				return report.error(err);
			}
			cb(null, file);
			report.emit('done', file);
		});
	});

	return report;
};