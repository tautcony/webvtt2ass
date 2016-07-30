var fs = require('fs');
var parser = new (require('./lib/webvtt/parser.js'))();
var TimeSpan = require('./lib/timespan');
var _ = require('Underscore');

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

var filename = 'samples/sample02';
var context = fs.readFileSync(filename, 'utf8').replace('\r', '');

var ret = parser.parse(context, 'subtitles');

console.log("﻿[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n");
console.log("[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,方正准圆_GBK,50,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0.5,2,10,10,10,1\n");
console.log("[Events]\nFormat: Layer, Start, End, Style, Actor, MarginL, MarginR, MarginV, Effect, Text");
ret.cues.forEach(function (item, index, array) {
    var beginTime = new TimeSpan(item.startTime*1000).assFormat();
    var endTime = new TimeSpan(item.endTime*1000).assFormat();
    var text = item.text;
    text = text.replace('\n', '\\N');
    text = _.unescape(text);
    console.log("Dialogue: 0,{0},{1},Default,,0,0,0,,{2}".format(beginTime, endTime, text));
});
