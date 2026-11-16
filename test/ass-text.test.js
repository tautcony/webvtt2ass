"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCueText } = require("../lib/webvtt/cue-text");
const { renderCueText, getCueActor, escapeAssText } = require("../lib/ass/text");

const render = value => renderCueText(parseCueText(value));

test("renders bold, italic, underline, newlines, and escapes ASS control text", () => {
    assert.equal(render("<b>B</b><i>I</i><u>U</u>\n{\\b1}"), "{\\b1}B{\\b0}{\\i1}I{\\i0}{\\u1}U{\\u0}\\N\\{\\\\b1\\}");
    assert.equal(escapeAssText("one\ntwo"), "one\\Ntwo");
});

test("timestamp nodes do not render and entities are not decoded twice", () => {
    assert.equal(render("A<00:02.000>B"), "AB");
    assert.equal(render("&amp;lt;"), "&lt;");
});

test("renders ruby base recursively and keeps ruby text", () => {
    assert.equal(render("<ruby><b>明日</b><rt>あした</rt></ruby>"), "{\\k}{\\b1}明日{\\b0}|あした{\\k}");
});

test("maps WebVTT foreground and background classes and reports unsupported classes", () => {
    assert.equal(render("<c.red.yellow.bg_blue>text</c>"), "{\\c&H00FFFF&\\4c&HFF0000&}text{\\c&H00FFFFFF&\\4c&H00000000&}");
    const diagnostics = [];
    assert.equal(renderCueText(parseCueText("<c.warning>x</c>"), { diagnostics }), "x");
    assert.equal(diagnostics[0].code, "UNSUPPORTED_STYLE_CLASS");
});

test("sets Actor only when one top-level voice contains all cue text", () => {
    assert.equal(getCueActor(parseCueText("<v Alice>Hello</v>")), "Alice");
    assert.equal(getCueActor(parseCueText("<v Alice>Hello</v> outside")), "");
    assert.equal(getCueActor(parseCueText("<v Alice>A</v><v Bob>B</v>")), "");
});
