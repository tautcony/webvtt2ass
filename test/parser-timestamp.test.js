"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parsePercentage, collectTimestamp, parseTimestamp } = require("../lib/webvtt/timestamp");

test("parsePercentage accepts complete percentages from 0 through 100", () => {
    for (const [input, expected] of [["0%", 0], ["100%", 100], ["50%", 50], ["50.5%", 50.5], ["0.01%", 0.01]]) {
        assert.equal(parsePercentage(input), expected);
    }
    for (const input of ["-1%", "101%", "50", ".5%", "50.%", "50abc%", "80abc%"] ) {
        assert.equal(parsePercentage(input), null, input);
    }
});

test("parseTimestamp supports minute and hour forms", () => {
    for (const [input, expected] of [
        ["00:00.000", 0], ["00:59.999", 59.999], ["59:59.999", 3599.999],
        ["01:00:00.000", 3600], ["1:02:03.000", 3723], ["100:00:00.000", 360000]
    ]) {
        assert.equal(parseTimestamp(input), expected, input);
    }
});

test("timestamps reject invalid fields, widths, fractions, and trailing text", () => {
    for (const input of ["00:60.000", "00:00.00", "00:00.0000", "00", "abc", "1:23.456", "00:00.000x"]) {
        assert.equal(parseTimestamp(input), null, input);
    }
});

test("collectTimestamp returns the end position without consuming trailing input", () => {
    assert.deepEqual(collectTimestamp("00:01.250 -->", 0), { value: 1.25, position: 9 });
});
