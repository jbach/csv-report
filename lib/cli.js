var csvReport = require('./main'),
	chalk = require('chalk'),
	inquirer = require('inquirer');

var setupInstance = function(argv){
	var main = new csvReport(argv).render();

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
};

var startInteractive = function(argv){
		inquirer.prompt([
			// todo
		], function(answers){
			console.log( JSON.stringify(answers, null, "  ") );
		});
};

module.exports.quiet = setupInstance;
module.exports.interactive = startInteractive;