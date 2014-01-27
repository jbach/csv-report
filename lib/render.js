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
	var renderHTML = function(cb){
		fs.readFile(main.options.template, 'utf-8', function (err, template) {
			if (err) return cb(err);
			cb(null, handlebars.compile(template)({
				projects: main.data
			}));
		});
	};

	var renderPDF = function(content, cb){
		phantom.create(function(ph) {
			return ph.createPage(function(page) {
				page.setContent(content);
				page.set('paperSize', main.options.paperSize);

				// render to pdf
				return page.render(main.options.out, function(){
					cb(null, main.options.out);
					return ph.exit();
				});
			});
		});
	};

	var render = function(){
		if(typeof main.data === 'undefined'){
			main.once('processDataDone', _.bind(render, main));
			return this;
		}

		renderHTML(function(err, html){
			if (err) return main.error(err);
			renderPDF(html, function(err, file){
				if (err) return main.error(err);
				main.emit('done', file);
			});
		});

		return main;
	};

	return render;
};