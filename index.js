const fs        = require("fs");
const parser    = new (require("./lib/webvtt/parser"))();
const subtitle  = require("./lib/subtitle.text");

function webvtt2ass(input, outputStream, font) {
    "use strict";
    fs.readFile(input, "utf8", (err, context) => {
        if (err !== null) { throw err; }
        outputStream.write(subtitle.assHead(font));
        parser.parse(context, "subtitles").cues.forEach((item) => {
            const ret = subtitle.parseSegment(item);
            outputStream.write(`Dialogue: 0,${ret.begin},${ret.end},${ret.style},${ret.voice},0,0,0,,${ret.text}\n`);
        });
    });
};

module.exports = webvtt2ass;
