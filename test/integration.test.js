"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseWebVTT } = require("../lib/webvtt");
const { renderDocument } = require("../lib/ass/renderer");

test("parses and renders the full REGION, STYLE, voice, class, entity, and ruby example", () => {
    const source = [
        "WEBVTT", "", "REGION", "id:test", "width:80%", "regionanchor:50%,100%", "viewportanchor:50%,90%", "", "STYLE",
        "::cue {", "  color: white;", "}", "", "cue-1", "00:00.000 --> 00:05.000 position:50%,center align:center",
        "<v Alice><c.yellow>Hello &amp; World</c></v>", "", "cue-2", "00:05.000 --> 00:10.000",
        "<ruby><b>明日</b><rt>あした</rt></ruby>"
    ].join("\n");
    const doc = parseWebVTT(source);
    assert.equal(doc.fatal, false);
    assert.equal(doc.cues.length, 2);
    assert.equal(doc.regions[0].id, "test");
    assert.equal(doc.styles[0].raw, "::cue {\n  color: white;\n}");
    assert.equal(doc.cues[0].nodes[0].value, "Alice");
    assert.equal(doc.cues[0].nodes[0].children[0].classes[0], "yellow");
    assert.equal(doc.cues[0].nodes[0].children[0].children[0].value, "Hello & World");
    assert.equal(doc.cues[1].nodes[0].children[0].children[0].value, "明日");
    const ass = renderDocument(doc);
    assert.match(ass, /Dialogue: 0,0:00:00\.00,0:00:05\.00,Default,Alice,/);
    assert.match(ass, /Dialogue: 0,0:00:05\.00,0:00:10\.00,Ruby,,/);
    assert.match(ass, /Hello & World/);
    assert.match(ass, /\{\\k\}\{\\b1\}明日\{\\b0\}\|あした\{\\k\}/);
    assert.match(ass, /\\pos\(960,1050\)/);
});

test("renders fatal signature errors before producing an ASS document", () => {
    const doc = parseWebVTT("invalid\n00:00.000 --> 00:01.000\ntext");
    assert.equal(doc.fatal, true);
    assert.equal(doc.cues.length, 0);
});
