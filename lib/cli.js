var csvReport = require('./main'),
	colors = require('colors');

module.exports = function(argv) {
	var main = new csvReport(argv).getProjects(function(err, projects){
		console.log(projects);
	});

	// regular logging
	if(argv.verbose){
		main.on('log', function(msg){
			console.log(msg);
		});
	}

	// task introduction
	main.on('task', function(msg){
		console.log('Info: '.bold.grey + msg);
	});

	// task completion
	main.on('success', function(msg){
		console.log('Success: '.bold.green + msg + '\n');
	});

	// errors
	main.on('error', function(msg){
		console.error('Error: '.bold.red + msg);
		process.exit(1);
	});

	// all done
	main.on('done', function(msg){
		console.log('All done.'.bold.green + ' ' + msg);
		process.exit(1);
	});
};