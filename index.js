var fs        = require('fs');
var parser    = new (require('./lib/webvtt/parser'))();
var subtitle  = require('./lib/subtitle.text');

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

function webvtt2ass(input, outputStream) {
    'use strict';
    fs.readFile(input, 'utf8', (err, context) => {
        if (err !== null) { throw err; }
        outputStream.write(subtitle.assHead());
        parser.parse(context, 'subtitles').cues.forEach(item => {
            var ret = subtitle.parseSegment(item);
            outputStream.write("Dialogue: 0,{0},{1},{2},{3},0,0,0,,{4}".format(ret.begin, ret.end, ret.style, ret.voice, ret.text) + "\n");
        });
    });
};

module.exports = webvtt2ass;
