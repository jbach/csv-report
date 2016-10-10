'use strict';
const CsvReport = require('./report');
const chalk = require('chalk');
const inquirer = require('inquirer');
const selectionHeader = [
	{ name: 'Include all', value: 'all' },
	new inquirer.Separator('-- Or select specific: --')
];

const cli = argv => {
	const report = new CsvReport(argv);

	// task introduction
	report.on('task', msg => console.log(chalk.bold.grey('Info:') + ' ' + msg));

	// task completion
	report.on('success', msg => console.log(chalk.bold.green('Success:') + ' ' + msg + '\n'));

	// verbose logging
	if(argv.verbose){
		report.on('log', msg => console.log(`Log: ${msg}`));
	}

	// get projects within timeframe
	report.getProjects()
		.then(projects => {
			if(projects.length === 0){
				throw new Error('There is no data within the selected timeframe.');
			}

			// filter projects via list selections
			return inquirer.prompt([{
				type: 'checkbox',
				name: 'includeProjects',
				message: 'Select projects you wish to include in the report',
				default: ['all'],
				choices: selectionHeader.concat(projects)
			}]);
		})
		.then(answers => report.render(answers.includeProjects))
		.then(msg => console.log(chalk.bold.green('All done.') + ' ' + msg))
		.catch(err => console.error(chalk.bold.red('Error:') + ' ' + err));
};

module.exports = cli;
