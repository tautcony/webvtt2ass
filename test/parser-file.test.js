"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseWebVTT, normalizeInput } = require("../lib/webvtt");

test("normalizes BOM, NULL, CRLF, CR, and UTF-8 buffers", () => {
    assert.equal(normalizeInput(Buffer.from("\uFEFFWEBVTT\r\na\rb\0")), "WEBVTT\na\nb\uFFFD");
    assert.equal(normalizeInput(Buffer.from([0xFF])), "\uFFFD");
});

test("accepts valid signatures and rejects invalid signatures as fatal", () => {
    for (const source of ["WEBVTT\n\n", "WEBVTT description\n\n", "WEBVTT\tdescription\n\n"]) {
        assert.equal(parseWebVTT(source).fatal, false);
    }
    for (const source of ["WEBVTT123", "WEBVT", "webvtt", " WEBVTT"]) {
        const result = parseWebVTT(source);
        assert.equal(result.fatal, true);
        assert.equal(result.diagnostics[0].code, "INVALID_SIGNATURE");
    }
});

test("collects NOTE, STYLE, REGION, and cues in source order", () => {
    const doc = parseWebVTT([
        "WEBVTT", "", "NOTE comment", "ignored", "", "STYLE", "::cue { color: red; }", "",
        "REGION", "id:r1", "width:40%", "", "cue-1", "00:05.000 --> 00:06.000", "first", "line", "",
        "00:01.000 --> 00:02.000", "second", ""
    ].join("\n"));
    assert.equal(doc.cues.length, 2);
    assert.deepEqual(doc.cues.map(cue => cue.id), ["cue-1", ""]);
    assert.deepEqual(doc.cues.map(cue => cue.startTime), [5, 1]);
    assert.equal(doc.cues[0].text, "first\nline");
    assert.equal(doc.styles[0].raw, "::cue { color: red; }");
    assert.equal(doc.styles[0].line, 7);
    assert.equal(doc.regions.length, 1);
    assert.equal(doc.regions[0].id, "r1");
    assert.equal(doc.regions[0].width, 40);
});

test("recovers a following cue when a payload has no blank separator", () => {
    const doc = parseWebVTT("WEBVTT\n\n00:00.000 --> 00:01.000\none\n00:01.000 --> 00:02.000\ntwo");
    assert.deepEqual(doc.cues.map(cue => cue.text), ["one", "two"]);
});

test("ignores unknown blocks and STYLE blocks after the first cue", () => {
    const doc = parseWebVTT("WEBVTT\n\nmetadata\nvalue\n\n00:00.000 --> 00:01.000\none\n\nSTYLE\n::cue { color: red; }\n\n00:01.000 --> 00:02.000\ntwo");
    assert.equal(doc.cues.length, 2);
    assert.equal(doc.styles.length, 0);
    assert.equal(doc.diagnostics.some(item => item.code === "INVALID_CUE_TIMING"), false);
});

test("does not report empty cue identifiers as duplicates", () => {
    const doc = parseWebVTT("WEBVTT\n\n00:00.000 --> 00:01.000\none\n\n00:01.000 --> 00:02.000\ntwo");
    assert.equal(doc.diagnostics.some(item => item.code === "DUPLICATE_CUE_ID"), false);
});
