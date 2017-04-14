var fs = require("fs");
var webvtt2ass = require("./");
var cli = process.argv.slice(2);

var printHelp = function printHelp() {
    console.error("Usage: webvtt2ass [vtt_file] [ass_file]");
    process.exit(0);
}

if (typeof cli[0] === "string" && cli[0].toLowerCase().indexOf("help") > -1) {
    return printHelp();
}

process.stdout.on("error", function(err) {
    if (err.code !== "EPIPE") throw err
});

if (cli.length >= 2) {
    var input = cli[0];
    var output = fs.createWriteStream(cli[1]);
} else if (cli.length === 1) {
    var input = cli[0];
    var output = process.stdout;
} else {
    printHelp();
}

webvtt2ass(input, output);
