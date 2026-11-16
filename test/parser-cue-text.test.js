"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { tokenizeCueText, parseCueText } = require("../lib/webvtt/cue-text");
const { parseWebVTT } = require("../lib/webvtt");

test("decodes character references once and tokenizes timestamps and markup", () => {
    const tokens = tokenizeCueText("&amp;lt; <00:02.000><b>x</b>");
    assert.deepEqual(tokens, [
        { type: "text", value: "&lt; " },
        { type: "timestamp", value: "00:02.000" },
        { type: "startTag", name: "b", classes: [], annotation: "" },
        { type: "text", value: "x" },
        { type: "endTag", name: "b" }
    ]);
});

test("preserves classes on supported tags and maps cue formatting nodes", () => {
    const root = parseCueText("<c.red.warning>r</c><i.emphasis>i</i><b>b</b><u>u</u>");
    assert.deepEqual(root.children.map(node => node.type), ["class", "italic", "bold", "underline"]);
    assert.deepEqual(root.children[0].classes, ["red", "warning"]);
    assert.deepEqual(root.children[1].classes, ["emphasis"]);
});

test("keeps decoded voice and language metadata on nested nodes", () => {
    const root = parseCueText("<v A&amp;B><lang ja><b>日本語</b></lang></v>");
    const voice = root.children[0];
    assert.equal(voice.type, "voice");
    assert.equal(voice.value, "A&B");
    assert.equal(voice.children[0].type, "lang");
    assert.equal(voice.children[0].children[0].language, "ja");
});

test("builds timestamp nodes, keeps ruby nesting, and ignores unknown or mismatched tags", () => {
    const root = parseCueText("A<00:02.000>B<unknown>x</wrong><rt>outside</rt><ruby><b>明日</b><rt>あした</rt></ruby>Z");
    assert.deepEqual(root.children.slice(0, 3).map(node => node.type), ["text", "timestamp", "text"]);
    assert.equal(root.children[3].value, "x");
    assert.equal(root.children[4].value, "outside");
    const ruby = root.children[5];
    assert.equal(ruby.type, "ruby");
    assert.equal(ruby.children[0].type, "bold");
    assert.equal(ruby.children[1].type, "rubyText");
    assert.equal(root.children[6].value, "Z");
});

test("stores parsed cue text AST on document cues", () => {
    const doc = parseWebVTT("WEBVTT\n\n00:00.000 --> 00:01.000\nA<00:00.500>B");
    assert.deepEqual(doc.cues[0].nodes.map(node => node.type), ["text", "timestamp", "text"]);
});
