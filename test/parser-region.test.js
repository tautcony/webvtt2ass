"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseRegionSettings } = require("../lib/webvtt/settings");
const { parseWebVTT } = require("../lib/webvtt");

test("parses region defaults and supported settings", () => {
    assert.deepEqual(parseRegionSettings(""), {
        id: "", width: 100, lines: 3,
        regionAnchor: { x: 0, y: 100 }, viewportAnchor: { x: 0, y: 100 }, scroll: null
    });
    const region = parseRegionSettings("id:fred width:40.5% lines:5 regionanchor:20%,80.5% viewportanchor:10%,90% scroll:up");
    assert.equal(region.id, "fred");
    assert.equal(region.width, 40.5);
    assert.equal(region.lines, 5);
    assert.deepEqual(region.regionAnchor, { x: 20, y: 80.5 });
    assert.deepEqual(region.viewportAnchor, { x: 10, y: 90 });
    assert.equal(region.scroll, "up");
});

test("keeps the last duplicate region setting and reports duplicate ids", () => {
    const diagnostics = [];
    assert.equal(parseRegionSettings("id:x width:30% width:40%", diagnostics).width, 40);
    assert.equal(diagnostics[0].code, "DUPLICATE_REGION_SETTING");
    const doc = parseWebVTT("WEBVTT\n\nREGION\nid:x\n\nREGION\nid:x\n\n00:00.000 --> 00:01.000 region:x\ntext");
    assert.equal(doc.diagnostics.some(item => item.code === "DUPLICATE_REGION_ID"), true);
    assert.equal(doc.cues[0].region, doc.regions[1]);
});

test("ignores invalid region values without rejecting the region", () => {
    const diagnostics = [];
    const region = parseRegionSettings("width:101% lines:2.5 regionanchor:20%,101% scroll:down", diagnostics);
    assert.equal(region.width, 100);
    assert.equal(region.lines, 3);
    assert.deepEqual(region.regionAnchor, { x: 0, y: 100 });
    assert.equal(region.scroll, null);
    assert.equal(diagnostics.filter(item => item.code === "INVALID_REGION_SETTING").length, 4);
    assert.equal(diagnostics.every(item => item.line === 1 && item.column === 1), true);
});
