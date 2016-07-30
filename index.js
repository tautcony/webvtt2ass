var fs        = require('fs');
var parser    = new (require('./lib/webvtt/parser.js'))();
var TimeSpan  = require('./lib/timespan');
var subtitle  = require('./lib/subtitle.text');
require('./lib/string.format');

function convert(input, outputStream) {
    'use strict';
    fs.readFile(input, 'utf8', (err, context) => {
        if (err !== null) { throw err; }
        outputStream.write(subtitle.assHead());
        parser.parse(context, 'subtitles').cues.forEach(item => {
            var beginTime = new TimeSpan(item.startTime * 1000).assFormat();
            var endTime   = new TimeSpan(item.endTime * 1000).assFormat();
            var text      = subtitle.parseTree(item.tree);
            outputStream.write("Dialogue: 0,{0},{1},{2},,0,0,0,,{3}".format(beginTime, endTime, text.voice, text.text) + "\n");
        });
    });
};

//convert('samples/sample02', process.stdout);

module.exports = convert;
