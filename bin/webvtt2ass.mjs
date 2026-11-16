#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import progressBar from "progress";
import { Command } from "commander";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const webvtt2ass = require("..");

process.stdout.on("error", function (err) {
    if (err.code !== "EPIPE") {
        throw err;
    }
});

const packageInfo = require("../package.json");
const program = new Command();
program
    .name("webvtt2ass")
    .description("Convert WebVTT (The Web Video Text Tracks Format, aka html5 video subtitles) into ASS subtitle.")
    .argument("[files...]", "WebVTT files to convert")
    .option("-i, --input <files...>", "WebVTT files to convert")
    .option("-f, --font <font>", "Use the specified font")
    .option("-o, --output <file>", "Place the output into a file")
    .version(`${packageInfo.name} ${packageInfo.version}`, "-v, --version", "Print the version.")
    .helpOption("-h, --help", "Display this help and exit")
    .configureOutput({
        // Preserve the existing CLI convention of writing help and version to stderr.
        writeOut: message => process.stderr.write(message)
    })
    .addHelpText("after", "\nIf multiple files are provided, --output is ignored; each input file is written beside its source as an .ass file.\n")
    .parse(process.argv);

const options = program.opts();
const inputs = [...program.args, ...(options.input || [])];

if (inputs.length === 0) {
    console.error("[error] Invalid options");
    program.outputHelp({ error: true });
    process.exit();
}

if (inputs.length === 1) {
    const output = options.output ? fs.createWriteStream(options.output) : process.stdout;
    if (!fs.existsSync(inputs[0])) {
        console.error(`[error] Input file ${inputs[0]} not found!`);
    } else {
        webvtt2ass(inputs[0], output, options.font);
    }
}

if (inputs.length > 1) {
    const deduplication = Array.from(new Set(inputs.map(input => path.resolve(input)))).map(input => {
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
