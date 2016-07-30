var fs        = require('fs');
var parser    = new (require('./lib/webvtt/parser.js'))();
var timespan  = require('./lib/timespan');
var parseText = require('./lib/subtitle.text');
require('./lib/string.format');

function assHead() {
    var ret = "[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n\n" +
    "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,方正准圆_GBK,50,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0.5,2,10,10,10,1\n\n"+
    "[Events]\nFormat: Layer, Start, End, Style, Actor, MarginL, MarginR, MarginV, Effect, Text";
    return ret;
}

var filename = 'samples/sample02';
var context = fs.readFileSync(filename, 'utf8').replace('\r', '');

var ret = parser.parse(context, 'subtitles');

console.log(ret);

console.log(assHead());

ret.cues.forEach(function (item, index, array) {
    var beginTime = new timespan(item.startTime*1000).assFormat();
    var endTime = new timespan(item.endTime*1000).assFormat();
    var text = parseText(item);
    console.log("Dialogue: 0,{0},{1},{2},,0,0,0,,{3}".format(beginTime, endTime, text.voice, text.text));
});
