"use strict";

const { performance } = require("node:perf_hooks");
const { parseWebVTT } = require("../lib/webvtt");
const { renderDocument } = require("../lib/ass/renderer");

const cueCount = Math.max(1, Number.parseInt(process.env.CUES || "25000", 10));
const iterations = Math.max(1, Number.parseInt(process.env.ITERATIONS || "3", 10));
const pad = value => String(value).padStart(2, "0");

function timestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) % 60;
    const rest = seconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(rest)}.000`;
}

function makeInput(count) {
    const blocks = ["WEBVTT", ""];
    const start = timestamp(0);
    const end = timestamp(2);
    for (let index = 0; index < count; index += 1) {
        blocks.push(
            `cue-${index}`,
            `${start} --> ${end} position:50%,center align:center`,
            `<v Speaker ${index % 8}><c.yellow><b>Caption ${index}</b></c> &amp; benchmark text</v>`,
            ""
        );
    }
    return blocks.join("\n");
}

function memory() {
    const value = process.memoryUsage();
    return { rss: value.rss, heapUsed: value.heapUsed, external: value.external };
}

function median(values) {
    const ordered = [...values].sort((a, b) => a - b);
    return ordered[Math.floor(ordered.length / 2)];
}

const input = makeInput(cueCount);
const bytes = Buffer.byteLength(input);
// Warm both code paths before measuring.
function warmup() {
    const document = parseWebVTT(input);
    renderDocument(document);
}
warmup();

const parseTimes = [];
const renderTimes = [];
let finalDocument;
if (global.gc) global.gc();
const beforeParseMemory = memory();
for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    finalDocument = parseWebVTT(input);
    parseTimes.push(performance.now() - start);
}
const afterParseMemory = memory();
let afterParseGcMemory = null;
if (global.gc) {
    global.gc();
    afterParseGcMemory = memory();
}

const beforeRenderMemory = memory();
for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    renderDocument(finalDocument);
    renderTimes.push(performance.now() - start);
}
const afterRenderMemory = memory();
let afterRenderGcMemory = null;
if (global.gc) {
    global.gc();
    afterRenderGcMemory = memory();
}

const parseMedianMs = median(parseTimes);
const renderMedianMs = median(renderTimes);
process.stdout.write(JSON.stringify({
    node: process.version,
    cues: cueCount,
    inputBytes: bytes,
    iterations,
    warmup: true,
    gcExposed: typeof global.gc === "function",
    parse: {
        medianMs: Number(parseMedianMs.toFixed(2)),
        cuesPerSecond: Math.round(cueCount / (parseMedianMs / 1000)),
        memoryBefore: beforeParseMemory,
        memoryAfter: afterParseMemory,
        memoryAfterGC: afterParseGcMemory
    },
    render: {
        medianMs: Number(renderMedianMs.toFixed(2)),
        cuesPerSecond: Math.round(cueCount / (renderMedianMs / 1000)),
        memoryBefore: beforeRenderMemory,
        memoryAfter: afterRenderMemory,
        memoryAfterGC: afterRenderGcMemory
    }
}, null, 2) + "\n");
