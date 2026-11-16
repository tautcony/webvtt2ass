"use strict";


function normalizeInput(input) {
    let text;
    if (Buffer.isBuffer(input)) {
        text = input.toString("utf8");
    } else if (typeof input === "string") {
        text = input;
    } else {
        throw new TypeError("WebVTT input must be a Buffer or string");
    }
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }
    return text.replace(/\0/g, "\uFFFD").replace(/\r\n?/g, "\n");
}

function createDocument() {
    return { cues: [], regions: [], styles: [], diagnostics: [], fatal: false };
}

function createCue() {
    return {
        id: "",
        startTime: 0,
        endTime: 0,
        region: null,
        vertical: "horizontal",
        snapToLines: true,
        line: "auto",
        lineAlign: "start",
        position: "auto",
        positionAlign: "auto",
        size: 100,
        align: "center",
        text: "",
        nodes: []
    };
}

function createRegion() {
    return {
        id: "",
        width: 100,
        lines: 3,
        regionAnchor: { x: 0, y: 100 },
        viewportAnchor: { x: 0, y: 100 },
        scroll: null
    };
}

function addDiagnostic(document, level, code, message, line, column) {
    document.diagnostics.push({ level, code, message, line, column });
}

function isMarker(line, marker) {
    return line.startsWith(marker) && (line.length === marker.length || /[\t ]/.test(line[marker.length]));
}

function parseWebVTT(input) {
    const { parseRegionSettings, parseCueTimingsAndSettings } = require("./settings");
    const { parseCueText } = require("./cue-text");
    const document = createDocument();
    const text = normalizeInput(input);
    const firstLineEnd = text.indexOf("\n");
    const signature = firstLineEnd < 0 ? text : text.slice(0, firstLineEnd);
    if (!/^WEBVTT(?:[\t ]|$)/.test(signature)) {
        document.fatal = true;
        addDiagnostic(document, "error", "INVALID_SIGNATURE", "Invalid WebVTT signature", 1, 1);
        return document;
    }

    const lines = text.split("\n");
    let index = 1;
    let seenCue = false;
    const cueIds = new Set();
    const regionIds = new Set();

    // The optional header block ends at the first blank line.
    if (index < lines.length && lines[index] !== "") {
        while (index < lines.length && lines[index] !== "") index += 1;
    }
    while (index < lines.length && lines[index] === "") index += 1;

    while (index < lines.length) {
        if (lines[index] === "") {
            index += 1;
            continue;
        }
        const blockStart = index;
        const first = lines[index];

        if (isMarker(first, "NOTE")) {
            while (index < lines.length && lines[index] !== "") index += 1;
            continue;
        }

        if (!seenCue && isMarker(first, "STYLE")) {
            const startLine = index + 2;
            index += 1;
            const raw = [];
            while (index < lines.length && lines[index] !== "") raw.push(lines[index++]);
            document.styles.push({ raw: raw.join("\n"), line: startLine });
            continue;
        }

        if (!seenCue && isMarker(first, "REGION")) {
            const raw = [];
            index += 1;
            while (index < lines.length && lines[index] !== "") raw.push(lines[index++]);
            const region = parseRegionSettings(raw.join(" "), document.diagnostics, blockStart + 2);
            if (region.id && regionIds.has(region.id)) {
                addDiagnostic(document, "warning", "DUPLICATE_REGION_ID", `Duplicate region id: ${region.id}`, blockStart + 1, 1);
            }
            if (region.id) regionIds.add(region.id);
            document.regions.push(region);
            continue;
        }

        let id = "";
        let timingLine = first;
        if (timingLine.indexOf("-->") < 0) {
            if (index + 1 < lines.length && lines[index + 1].indexOf("-->") >= 0) {
                id = first;
                index += 1;
                timingLine = lines[index];
            } else {
                // Unknown blocks are ignored. Only an arrow-bearing line is a failed cue timing.
                while (index < lines.length && lines[index] !== "") index += 1;
                continue;
            }
        }
        const timingLineNumber = id === "" ? blockStart + 1 : blockStart + 2;
        const cue = parseCueTimingsAndSettings(timingLine, document.regions, document.diagnostics, timingLineNumber);
        if (!cue) {
            addDiagnostic(document, "warning", "INVALID_CUE_TIMING", "Unable to parse cue timing", id === "" ? blockStart + 1 : blockStart + 2, 1);
            while (index < lines.length && lines[index] !== "") index += 1;
            continue;
        }
        cue.id = id;
        if (cue.endTime <= cue.startTime) {
            addDiagnostic(document, "warning", "INVALID_CUE_TIME_RANGE", "Cue end time must be after start time", blockStart + 1, 1);
        }
        if (cue.id) {
            if (cueIds.has(cue.id)) {
                addDiagnostic(document, "warning", "DUPLICATE_CUE_ID", `Duplicate cue id: ${cue.id}`, blockStart + 1, 1);
            }
            cueIds.add(cue.id);
        }
        const previousCue = document.cues[document.cues.length - 1];
        if (previousCue && cue.startTime < previousCue.startTime) {
            addDiagnostic(document, "warning", "NON_MONOTONIC_CUE_START", "Cue start times are not in ascending order", blockStart + 1, 1);
        }
        index += 1;
        const payload = [];
        while (index < lines.length && lines[index] !== "") {
            // A new arrow line starts a recoverable cue block, even if a blank separator is missing.
            if (lines[index].includes("-->")) break;
            payload.push(lines[index++]);
        }
        cue.text = payload.join("\n");
        cue.nodes = parseCueText(cue.text).children;
        document.cues.push(cue);
        seenCue = true;
    }
    return document;
}

module.exports = { normalizeInput, createDocument, createCue, createRegion, parseWebVTT };
