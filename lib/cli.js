var csvReport = require('./main'),
	chalk = require('chalk'),
	inquirer = require('inquirer');

var setupInstance = function(argv){
	var main = new csvReport(argv);

	// regular logging
	if(argv.verbose){
		main.on('log', function(msg){
			console.log('Log: ' + msg);
		});
	}

	// task introduction
	main.on('task', function(msg){
		console.log(chalk.bold.grey('Info:') + ' ' + msg);
	});

	// task completion
	main.on('success', function(msg){
		console.log(chalk.bold.green('Success:') + ' ' + msg + '\n');
	});

	// errors
	main.on('error', function(msg){
		console.error(chalk.bold.red('Error:') + ' ' + msg);
		process.exit(1);
	});

	// all done
	main.on('done', function(msg){
		console.log(chalk.bold.green('All done.') + ' ' + msg);
		process.exit(1);
	});

	return main;
};

var startInteractive = function(argv){
	// spin up instance
	var main = setupInstance(argv);

	main.getProjects(function(err, projects){
		// lets ask some questions
		var questions = [];

		projects.unshift(new inquirer.Separator('-- Or select specific: --'));
		projects.unshift({
			name: 'Include all',
			value: 'all'
		});

		// which projects to include
		questions.push({
			type: 'checkbox',
			name: 'includeProjects',
			message: 'Select projects you wish to include in the report',
			default: ['all'],
			choices: projects
		});

		inquirer.prompt(questions, function(answers){
			main.render(answers.includeProjects);
		});
	});
};

module.exports.quiet = setupInstance;
module.exports.interactive = startInteractive;