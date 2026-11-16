"use strict";
const fs = require("fs");
const { parseWebVTT } = require("./lib/webvtt");
const { renderDocument } = require("./lib/ass/renderer");

function webvtt2ass(input, outputStream, font) {
    fs.readFile(input, (err, buffer) => {
        if (err !== null) { throw err; }
        const document = parseWebVTT(buffer);
        if (document.fatal) {
            const diagnostic = document.diagnostics.find(item => item.level === "error");
            throw new Error(diagnostic ? diagnostic.message : "Invalid WebVTT file");
        }
        outputStream.write(renderDocument(document, font));
    });
}

module.exports = webvtt2ass;
