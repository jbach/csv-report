'use strict';
const CsvReport = require('./report');
const chalk = require('chalk');
const inquirer = require('inquirer');

const setupInstance = argv => {
	const report = new CsvReport(argv);

	// regular logging
	if(argv.verbose){
		report.on('log', msg => console.log('Log: ' + msg));
	}

	// task introduction
	report.on('task', msg => console.log(chalk.bold.grey('Info:') + ' ' + msg));

	// task completion
	report.on('success', msg => console.log(chalk.bold.green('Success:') + ' ' + msg + '\n'));

	// errors
	report.on('error', msg => {
		console.error(chalk.bold.red('Error:') + ' ' + msg);
		process.exit(1);
	});

	// all done
	report.on('done', msg => {
		console.log(chalk.bold.green('All done.') + ' ' + msg);
		process.exit(1);
	});

	return report;
};

const cli = argv => {
	// spin up instance
	const report = setupInstance(argv);

	report.getProjects((err, projects) => {
		if(projects.length === 0){
			report.emit('done', 'There is no data within the selected timeframe.');
		}

		// lets ask some questions
		const questions = [];

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

		inquirer.prompt(questions, answers => report.render(answers.includeProjects));
	});
};

module.exports = cli;
