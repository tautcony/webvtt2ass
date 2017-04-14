const fs = require("fs");
const webvtt2ass = require("./");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");

const sections = [
    {
        header: "webvtt2ass",
        content: "Convert WebVTT (The Web Video Text Tracks Format, aka html5 video subtitles) into ASS subtitle."
    },
    {
        header: "Usage",
        content: "$ webvtt2ass [arguments]"
    },
    {
        header: "Command List",
        content: [
            { name: "--font [font name]", summary: "Use the Specified font" },
            { name: "--output [file]", summary: "Place the output into [file]" },
            { name: "--help", summary: "display this help and exit" },
            { name: "--version", summary: "Print the version." }
        ]
    }
];

const optionDefinitions = [
    { name: "input", alias: 'i', defaultOption: true, type: String},
    { name: "font", alisa: 'f', type: String},
    { name: "output", alias: 'o', type: String },
    { name: "help", alias: 'h', type: Boolean },
    { name: "version", type: Boolean }
];

process.stdout.on("error", function (err) {
    "use strict";
    if (err.code !== "EPIPE") {
        throw err;
    }
});

let options = commandLineArgs(optionDefinitions);
console.log(options);
const valid = options.help || options.version || (options.input && fs.existsSync(options.input));
if (!valid) {
    options.help = true;
    console.log("Invalid options");
}

if (options.version === true) {
    var info = require('./package.json');
    console.log(info.name + " " + info.version);
    process.exit();
}

if (options.help === true) {
    console.log(commandLineUsage(sections));
    process.exit();
}
let output = process.stdout;
if (options.output && options.output.length > 0) {
    output = fs.createWriteStream(options.output);
}

webvtt2ass(options.input, output, options.font);
