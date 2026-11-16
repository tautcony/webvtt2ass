"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createCue } = require("../lib/webvtt/parser");
const { resolveCueLayout, resolveSnapLinePosition } = require("../lib/ass/layout");

test("maps align values to bottom left, center, and right", () => {
    for (const [align, expected] of [["left", 1], ["start", 1], ["center", 2], ["right", 3], ["end", 3]]) {
        const cue = createCue(); cue.align = align;
        assert.equal(resolveCueLayout(cue).alignment, expected);
    }
});

test("maps position and percentage line anchors to ASS positions", () => {
    const cue = createCue(); cue.position = 50; cue.positionAlign = "center"; cue.line = 90; cue.snapToLines = false; cue.lineAlign = "end";
    assert.deepEqual(resolveCueLayout(cue), { alignment: 2, marginL: 0, marginR: 0, marginV: 0, tags: ["\\pos(960,972)"] });
});

test("estimates positive and negative snap lines in one helper", () => {
    const cue = createCue();
    cue.line = 0; assert.equal(resolveSnapLinePosition(cue), 30);
    cue.line = 2; assert.equal(resolveSnapLinePosition(cue), 150);
    cue.line = -1; assert.equal(resolveSnapLinePosition(cue), 1050);
    cue.line = -2; assert.equal(resolveSnapLinePosition(cue), 990);
});

test("approximates cue size and region anchor relationships with diagnostics", () => {
    const diagnostics = [];
    const cue = createCue();
    cue.size = 80;
    cue.region = { width: 40, regionAnchor: { x: 50, y: 100 }, viewportAnchor: { x: 50, y: 90 }, scroll: "up" };
    const layout = resolveCueLayout(cue, { diagnostics });
    assert.equal(layout.alignment, 2);
    assert.ok(layout.tags.includes("\\pos(960,972)"));
    assert.equal(diagnostics[0].code, "APPROXIMATE_CUE_SIZE");
    assert.equal(diagnostics[1].code, "UNSUPPORTED_REGION_SCROLL");
});

test("reports unsupported vertical layout without dropping the cue", () => {
    const diagnostics = [];
    const cue = createCue(); cue.vertical = "rl";
    assert.equal(resolveCueLayout(cue, { diagnostics }).alignment, 2);
    assert.equal(diagnostics[0].code, "UNSUPPORTED_VERTICAL_LAYOUT");
});
