var csvReport = require('./report');
var chalk = require('chalk');
var inquirer = require('inquirer');

var setupInstance = function(argv){
	var report = new csvReport(argv);

	// regular logging
	if(argv.verbose){
		report.on('log', function(msg){
			console.log('Log: ' + msg);
		});
	}

	// task introduction
	report.on('task', function(msg){
		console.log(chalk.bold.grey('Info:') + ' ' + msg);
	});

	// task completion
	report.on('success', function(msg){
		console.log(chalk.bold.green('Success:') + ' ' + msg + '\n');
	});

	// errors
	report.on('error', function(msg){
		console.error(chalk.bold.red('Error:') + ' ' + msg);
		process.exit(1);
	});

	// all done
	report.on('done', function(msg){
		console.log(chalk.bold.green('All done.') + ' ' + msg);
		process.exit(1);
	});

	// start parsing
	report.parse();

	return report;
};

var startInteractive = function(argv){
	// spin up instance
	var report = setupInstance(argv);

	report.getProjects(function(err, projects){
		if(projects.length === 0){
			report.emit('done', 'There is no data within the selected timeframe.');
		}
		
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
			report.render(answers.includeProjects);
		});
	});
};

module.exports.quiet = function(argv){
	setupInstance(argv).render();
};
module.exports.interactive = startInteractive;