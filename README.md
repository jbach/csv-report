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

- <string>
- **required**

#### `options.out`
Path to output PDF file

- <string>
- Default: `./report-<last-month>-<year>.pdf`

#### `options.delim`
Delimeter used in CSV file.

- <string>
- Default: `;`

#### `options.start`
Start date of timeframe

- <string> format: `YYYY-MM-DD`
- Default: First day of previous month

#### `options.end`
End date of timeframe

- <string> format: `YYYY-MM-DD`
- Default: Last day of previous month

#### `options.round`
Minutes to round up to. e.g. 21m -> 30m. Applied per day.

- <int>
- Default: `15`

#### `options.template`
Path to [Handlebars](http://handlebarsjs.com/) template

- <string>
- Default: `./lib/template.html`

#### `options.lang`
Language. Currently used for output formatting of dates.

- <string>
- Default: `en`

### Events

#### `report.on('log', function(logMsg){})`
#### `report.on('error', function(errorMsg){})`
#### `report.on('done', function(outputPath){})`

## License

MIT