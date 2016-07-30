var fs        = require('fs');
var parser    = new (require('./lib/webvtt/parser'))();
var subtitle  = require('./lib/subtitle.text');
require('./lib/string.format');

function webvtt2ass(input, outputStream) {
    'use strict';
    fs.readFile(input, 'utf8', (err, context) => {
        if (err !== null) { throw err; }
        outputStream.write(subtitle.assHead());
        parser.parse(context, 'subtitles').cues.forEach(item => {
            var ret = subtitle.parseSegment(item);
            outputStream.write("Dialogue: 0,{0},{1},{2},,0,0,0,,{3}".format(ret.begin, ret.end, ret.voice, ret.text) + "\n");
        });
    });
};

webvtt2ass('samples/sample02', process.stdout);

module.exports = webvtt2ass;
