"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCueTimingsAndSettings } = require("../lib/webvtt/settings");

const timing = value => `00:00.000 --> 00:05.000 ${value}`;

test("parses cue timing, align, vertical, line, position, and size settings", () => {
    const cue = parseCueTimingsAndSettings(timing("vertical:rl line:-1.5,start position:50.5%,center size:80.5% align:right"), [], []);
    assert.equal(cue.startTime, 0);
    assert.equal(cue.endTime, 5);
    assert.equal(cue.vertical, "rl");
    assert.equal(cue.line, -1.5);
    assert.equal(cue.snapToLines, true);
    assert.equal(cue.lineAlign, "start");
    assert.equal(cue.position, 50.5);
    assert.equal(cue.positionAlign, "center");
    assert.equal(cue.size, 80.5);
    assert.equal(cue.align, "right");
});

test("supports percentages, standalone align values, and ignores middle", () => {
    for (const value of ["line:20%", "line:20.5%,end", "position:0%", "position:100%,line-right", "align:start", "center", "align:middle"]) {
        assert.ok(parseCueTimingsAndSettings(timing(value), [], []), value);
    }
    const cue = parseCueTimingsAndSettings(timing("align:middle"), [], []);
    assert.equal(cue.align, "center");
});

test("applies region, line, vertical, and size settings in source order", () => {
    const region = { id: "r" };
    assert.equal(parseCueTimingsAndSettings(timing("region:r line:20%"), [region], []).region, null);
    assert.equal(parseCueTimingsAndSettings(timing("line:20% region:r"), [region], []).region, region);
    assert.equal(parseCueTimingsAndSettings(timing("vertical:lr region:r"), [region], []).region, region);
    assert.equal(parseCueTimingsAndSettings(timing("region:r vertical:lr"), [region], []).region, null);
    assert.equal(parseCueTimingsAndSettings(timing("region:r size:80%"), [region], []).region, null);
});

test("applies repeated settings in order and reports non-fatal invalid settings", () => {
    const diagnostics = [];
    const cue = parseCueTimingsAndSettings(timing("align:start align:end line:1.5 position:50.5% align:middle"), [], diagnostics);
    assert.equal(cue.align, "end");
    assert.equal(cue.line, 1.5);
    assert.equal(cue.position, 50.5);
    assert.equal(diagnostics.filter(item => item.code === "DUPLICATE_CUE_SETTING").length, 2);
    assert.equal(diagnostics.filter(item => item.code === "INVALID_CUE_SETTING").length, 1);
    assert.equal(diagnostics.every(item => item.line === 1 && item.column === 1), true);
});

test("rejects unparseable timings but keeps authoring range errors", () => {
    assert.equal(parseCueTimingsAndSettings("00:60.000 --> 00:01.000", [], []), null);
    const doc = require("../lib/webvtt").parseWebVTT("WEBVTT\n\n00:02.000 --> 00:01.000\ntext");
    assert.equal(doc.cues.length, 1);
    assert.equal(doc.diagnostics[0].code, "INVALID_CUE_TIME_RANGE");
});
