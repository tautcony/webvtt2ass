"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseWebVTT } = require("../lib/webvtt");
const { renderDocument } = require("../lib/ass/renderer");

const fixture = name => fs.readFileSync(path.join(__dirname, "fixtures", name));

test("review case: malformed cue is skipped, valid cues retain input order and diagnostics", () => {
    const doc = parseWebVTT(fixture("recovery.vtt"));
    assert.equal(doc.fatal, false);
    assert.deepEqual(doc.cues.map(cue => cue.startTime), [5, 1]);
    assert.deepEqual(doc.cues.map(cue => cue.id), ["same-id", "same-id"]);
    assert.ok(doc.diagnostics.some(item => item.code === "INVALID_CUE_TIMING" && item.line === 7));
    assert.ok(doc.diagnostics.some(item => item.code === "NON_MONOTONIC_CUE_START"));
    assert.ok(doc.diagnostics.some(item => item.code === "DUPLICATE_CUE_ID"));
});

test("review case: duplicate region IDs resolve to the last region and preserve STYLE", () => {
    const doc = parseWebVTT(fixture("regions-style.vtt"));
    assert.equal(doc.regions.length, 2);
    assert.equal(doc.regions[0].width, 60.5);
    assert.equal(doc.regions[1].width, 80);
    assert.equal(doc.cues[0].region, doc.regions[1]);
    assert.equal(doc.styles[0].raw, "::cue(.warning) { color: yellow; }");
    assert.ok(doc.diagnostics.some(item => item.code === "DUPLICATE_REGION_ID"));
});

test("review case: escaped cue text cannot inject ASS overrides or decode twice", () => {
    const doc = parseWebVTT(fixture("escaping.vtt"));
    const ass = renderDocument(doc);
    assert.ok(ass.includes(String.raw`\{\\b1\}`));
    assert.equal(ass.includes("{\\b1} literal override"), false);
});

test("review case: setting diagnostics point to the timing line", () => {
    const doc = parseWebVTT("WEBVTT\n\ncue-id\n00:00.000 --> 00:01.000 align:middle\ntext");
    const invalid = doc.diagnostics.find(item => item.code === "INVALID_CUE_SETTING");
    assert.equal(invalid.line, 4);
    assert.equal(invalid.column, 1);
});
