var fs = require('fs'),
	phantom = require('phantom'),
	handlebars = require('handlebars'),
	_ = require('underscore');

handlebars.registerHelper('hours', function(seconds) {
	return seconds / 3600;
});

handlebars.registerHelper('date', function() {
	return this.date.format('L');
});

handlebars.registerHelper('task', function() {
	return this.task.join('; ');
});

module.exports = function(main){
	var renderHTML = function(includeProjects, cb){
		var data = main.data;

		// reduce dataset if parameter is array, otherwise include all
		if(includeProjects && _.isArray(includeProjects) && includeProjects.length > 0 && !_.contains(includeProjects, 'all')){
			main.log('reducing to following projects: ', includeProjects);
			data = _.filter(data, function(project){
				return _.contains(includeProjects, project.project);
			});
		}

		main.log('reading template from: ', main.options.template);

		fs.readFile(main.options.template, 'utf-8', function (err, template) {
			if (err) return cb(err);
			cb(null, handlebars.compile(template)({
				projects: data
			}));
		});
	};

	var renderPDF = function(content, cb){
		main.log('spinning up PhantomJS');

		phantom.create(function(ph) {
			return ph.createPage(function(page) {
				page.setContent(content);
				page.set('paperSize', main.options.paperSize);

				// render to pdf
				main.log('rendering PDF');
				return page.render(main.options.out, function(){
					main.log('rendering done');
					cb(null, main.options.out);
					return ph.exit();
				});
			});
		});
	};

	var render = function(includeProjects, cb){
		if ((!cb || typeof cb != "function")) {
			if(typeof includeProjects === 'function'){
				cb = includeProjects;
				includeProjects = undefined;
			}else{
				cb = function(){};
			}
		}

		if(typeof main.data === 'undefined'){
			main.once('processDataDone', _.bind(render, main, includeProjects, cb));
			return this;
		}

		renderHTML(includeProjects, function(err, html){
			if (err) {
				cb(err);
				return main.error(err);
			}
			renderPDF(html, function(err, file){
				if (err) {
					cb(err);
					return main.error(err);
				}
				cb(null, file);
				main.emit('done', file);
			});
		});

		return main;
	};

	return render;
};