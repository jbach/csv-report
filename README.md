csv-report
==========
Converts time tracking data from CSV to PDF.

## Installing

```bash
$ npm install csv-report -g
```

## Running

There are two ways to use csv-report: through the command line interface, or by requiring the csv-report module in your own code.

### Running via CLI

```bash
$ csv-report -f /path/to/csvFile.csv -o /path/to/pdfFile.pdf [options]
```

Check `$ csv-report -h` to see all available options.

### Running via Node

```javascript
const csvReport = require('csv-report');

// set options
const options = {
	file: '/path/to/my/csvFile.csv',
	out: '/path/to/resulting/pdfFile.pdf'
};

// render
const report = new csvReport(options)
	.render()
	.then(pdfPath => console.log('PDF was written to ' + pdfPath))
	.catch(console.log.bind(console));
```
### Methods

#### `report.getProjects() => Promise`
Returns a list of project names that have data within the provided timeframe.

#### `report.getEntries(project) => Promise`
Returns a list of task entries related to a specific project

- `project` (string): Provide project name to get a projects tasks, or leave empty to get all.

#### `report.render(includeProjects) => Promise`
Starts the rendering process.

- `includeProjects` (array): Specify a list of project names that you want to include in the report. __Default: Include all__

### Options
Call the constructor with these `options`:

#### `options.file`
Path to input CSV file

- String
- **required**

#### `options.out`
Path to output PDF file (can be path to folder or .pdf file)

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

The default mapping matches the CSV export of [TimeTracker 1.3](https://code.google.com/p/time-tracker-mac/).

#### `options.delim`
Delimeter used in the input CSV file

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

#### `report.on('log', logMsg => {})`

## License

MIT
