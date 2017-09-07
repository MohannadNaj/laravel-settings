let files = ['src/**/*.php',
            'tests/**/*.php',
            'app/**/*.php'];

let cmd = '"./vendor/bin/phpunit"';

let chokidarOptions = {};

let chokidar = require('chokidar');

// debounce from: https://stackoverflow.com/a/24004942/4330182
let debounce = (func, wait, immediate) => {
    var timeout;           

    return function() {
        var context = this, 
            args = arguments;

        var callNow = immediate && !timeout;

        clearTimeout(timeout);   

        timeout = setTimeout(function() {

             timeout = null;

             if (!immediate) {
               func.apply(context, args);
             }
        }, wait);

        if (callNow) func.apply(context, args);  
     }; 
};

let handleOutput = (error, stdout, stderr) => {
	    if (error) {
	        console.error(`exec error: ${error}`);
	    }
/*	    console.log(`${stdout}`);
	    console.log(`${stderr}`);*/
	};
 
 let eventInfoStructure = (path) => { return [
    ['\x1b[92m','____________________'],
    ['\x1b[39m','------------'],
    ['\x1b[39m','|', '\x1b[34m',
      new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      ],
    ['\x1b[39m' , '| File: ', '\x1b[32m', path],
    ['\x1b[39m' , '------------'],
 ];
};

var countFileChanges = [];

let eventInfo = (path) => {
    eventInfoStructure(path).forEach((line) => {
      console.log.apply(console, line);
    })
};

let getFilters = (_path) => {
  var uniqueFileChanges = countFileChanges.filter((elem, pos) => {
    return countFileChanges.indexOf(elem) == pos;
  });

  if(uniqueFileChanges.length != 1 || _path.toLowerCase().indexOf('tests') == -1)
    return '';

  var changedFile = path.parse(_path).name;
  var phpunitFilter = ` --filter ${changedFile}`;

  console.log(phpunitFilter);
  return phpunitFilter;
};

let execute = debounce((path) => {
  console.log('running phpunit..');
  var execProcess = exec(cmd + getFilters(path) , handleOutput);
  execProcess.stdout.pipe(process.stdout);
  countFileChanges = [];
}, 1000);

let handleChange = (_path) => {
    eventInfo(_path);
    countFileChanges.push(_path);
    execute(_path);
};

const exec = require('child_process').exec;

const watcher = chokidar.watch(files, chokidarOptions);

// Event listeners.
watcher
  .on('change', handleChange);
