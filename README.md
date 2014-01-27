csv-report
==========
Converts time tracking data from CSV to PDF.

## Installing

```bash
$ npm install csv-report --save
```

Make sure [PhantomJS](https://github.com/ariya/phantomjs/) is installed. You may install it via Homebrew:

```bash
$ brew install phantomjs
```

## Running

There are two ways to use csv-report: through the command line interface, or by requiring the csv-report module in your own code.

### Running via CLI

If installed locally:

```bash
$ ./node_modules/.bin/csv-report -f /path/to/my/csvFile.csv -o /path/to/resulting/pdfFile.pdf [options]
```

If installed globally (`$ npm install csv-report -g`):

```bash
$ csv-report -f /path/to/my/csvFile.csv -o /path/to/resulting/pdfFile.pdf [options]
```

Check `$ csv-report -h` to see all available options.

### Running via Node

```javascript
var csvReport = require('csv-report');

// set options
var options = {
	file: '/path/to/my/csvFile.csv',
	out: '/path/to/resulting/pdfFile.pdf'
};

// render 
var report = new csvReport(options)
.render(function(err, pdfPath){
	console.log('PDF was written to ' + pdfPath);
});
```
### Methods

#### `report.getProjects(callback)`
Returns a list of project names that have data within the provided timeframe.

- `callback`: arguments will be `callback(err, list)`

#### `report.getEntries(project, callback)`
Returns a list of task entries related to a specific project

- `project`: Provide project name to get a projects tasks, or leave empty to get all.
- `callback`: arguments will be `callback(err, entries)`

#### `report.render(callback)`
Starts the rendering process.

- `callback`: arguments will be `callback(err, outputPath)`

### Options
Call the constructor with these `options`:

#### `options.file`
Path to input CSV file

- String
- **required**

#### `options.out`
Path to output PDF file

- String
- Default: `./report-<last-month>-<year>.pdf`

#### `options.mappings`
Map the corresponding fields to CSV columns

- Object
- Default:

```javascript
{
	date: 'Date',
	project: 'Project',
	task: 'Task',
	duration: 'Duration',
	start: 'Start',
	end: 'End',
	custom: {
		comment: 'Comment'
	}
}
```

#### `options.delim`
Delimeter used in CSV file.

- String
- Default: `;`

#### `options.dateFormat`
If you are using the `date` column, you can specify format(s) that will be used for parsing the dates in the CSV file

- String | Array
- Default: `['MM-DD-YYYY', 'YYYY-MM-DD']``

#### `options.startFormat`
If you are using the `start` column, you can specify format(s) that will be used for parsing the dateTimes in the CSV file

- String | Array
- Default: `['YYYY-MM-DD HH:mm:ss']`

#### `options.endFormat`
If you are using the `end` column, you can specify format(s) that will be used for parsing the dateTimes in the CSV file

- String | Array
- Default: `['YYYY-MM-DD HH:mm:ss']`

#### `options.start`
Start date of timeframe

- String, format: `YYYY-MM-DD`
- Default: First day of previous month

#### `options.end`
End date of timeframe

- String, format: `YYYY-MM-DD`
- Default: Last day of previous month

#### `options.round`
Minutes to round up to. e.g. 21m -> 30m. Applied per day.

- Number
- Default: `15`

#### `options.template`
Path to [Handlebars](http://handlebarsjs.com/) template

- String
- Default: `./lib/template.html`

#### `options.paperSize`
Define details for the papersize of output PDF. See [PhantomJS wiki](https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage#wiki-webpage-paperSize) for details

- Object
- Default: `{ format: 'A4', orientation: 'landscape', border: '1.5cm' }`

#### `options.lang`
Language. Currently used for output formatting of dates.

- String
- Default: `en`

### Events

#### `report.on('log', function(logMsg){})`
#### `report.on('error', function(errorMsg){})`
#### `report.on('done', function(outputPath){})`

## License

MIT