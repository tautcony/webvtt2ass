"use strict";
const webvtt2ass = require("..");
const fs = require("fs");
const path = require("path");
const progressBar = require("progress");
const commandLineArgs  = require("command-line-args");
const commandLineUsage = require("command-line-usage");

const sections = [
    {
        header: "webvtt2ass",
        content: "Convert WebVTT (The Web Video Text Tracks Format, aka html5 video subtitles) into ASS subtitle."
    },
    {
        header: "Usage",
        content: "$ webvtt2ass [arguments] file[s]\n\nIf multiple files provided, output option will be ignored,\neach [file].vtt will be converted and written into [file].ass."
    },
    {
        header: "Command List",
        content: [
            {name: "--font [font name]", summary: "Use the Specified font"},
            {name: "--output [file]", summary: "Place the output into [file]"},
            {name: "--help", summary: "display this help and exit"},
            {name: "--version", summary: "Print the version."}
        ]
    }
];

const optionDefinitions = [
    {name: "input", alias: "i", multiple: true, defaultOption: true, type: String},
    {name: "font", alisa: "f", type: String},
    {name: "output", alias: "o", type: String},
    {name: "help", alias: "h", type: Boolean},
    {name: "version", alias: "v", type: Boolean}
];

process.stdout.on("error", function (err) {
    if (err.code !== "EPIPE") {
        throw err;
    }
});

const options = commandLineArgs(optionDefinitions);

if (options.help) {
    console.error(commandLineUsage(sections));
    process.exit();
}

if (options.version) {
    const info = require("../package.json");
    console.error(`${info.name} ${info.version}`);
    process.exit();
}

if (!options.input) {
    console.error("[error] Invalid options");
    console.error(commandLineUsage(sections));
    process.exit();
}

if (options.input && options.input.length === 1) {
    let output = options.output ? fs.createWriteStream(options.output) : process.stdout;
    if (!fs.existsSync(options.input[0])) {
        console.error(`[error] Input file ${options.input[0]} not found!`);
    } else {
        webvtt2ass(options.input[0], output, options.font);
    }
}

if (options.input && options.input.length > 1) {
    const deduplication = Array.from(new Set(options.input.map(input => path.resolve(input)))).map(input => {
        const info = path.parse(input);
        return {
            src: input,
            dst: path.join(info.dir, `${info.name}.ass`)
        };
    });
    
    const bar = new progressBar("processing [:bar] :percent", {
        complete: "=",
        incomplete: " ",
        width: 60,
        total: deduplication.length
    });
    
    const errorList = [];
    
    deduplication.forEach(input => {
        if (!fs.existsSync(input.src)) {
            errorList.push(input.src);
        } else {
            webvtt2ass(input.src, fs.createWriteStream(input.dst), options.font);
        }
        bar.tick();
    });
    if (errorList.length > 0) {
        console.error("\n[error] following files could not be found and will not be processed.\n"
            + errorList.join("\n"));
        process.exit(1);
    }
}
