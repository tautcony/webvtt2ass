"use strict";

const { parsePercentage, collectTimestamp } = require("./timestamp");
const { createCue, createRegion } = require("./parser");

function diagnostic(diagnostics, code, message, line) {
    if (diagnostics) diagnostics.push({ level: "warning", code, message, line: line || 1, column: 1 });
}

function parseRegionSettings(input, diagnostics, line) {
    const region = createRegion();
    const seen = new Set();
    for (const token of String(input).split(/[\t ]+/).filter(Boolean)) {
        const colon = token.indexOf(":");
        if (colon <= 0 || colon === token.length - 1) continue;
        const name = token.slice(0, colon);
        const value = token.slice(colon + 1);
        if (seen.has(name)) diagnostic(diagnostics, "DUPLICATE_REGION_SETTING", `Duplicate region setting: ${name}`, line);
        seen.add(name);
        let valid = true;
        switch (name) {
        case "id":
            region.id = value;
            break;
        case "width": {
            const percentage = parsePercentage(value);
            valid = percentage !== null;
            if (valid) region.width = percentage;
            break;
        }
        case "lines":
            valid = /^\d+$/.test(value);
            if (valid) region.lines = Number(value);
            break;
        case "regionanchor":
        case "viewportanchor": {
            const match = /^(\d+(?:\.\d+)?%),(\d+(?:\.\d+)?%)$/.exec(value);
            const x = match && parsePercentage(match[1]);
            const y = match && parsePercentage(match[2]);
            valid = x !== null && x !== undefined && y !== null && y !== undefined;
            if (valid) region[name === "regionanchor" ? "regionAnchor" : "viewportAnchor"] = { x, y };
            break;
        }
        case "scroll":
            valid = value === "up";
            if (valid) region.scroll = "up";
            break;
        default:
            valid = false;
        }
        if (!valid) diagnostic(diagnostics, "INVALID_REGION_SETTING", `Invalid region setting: ${token}`, line);
    }
    return region;
}

function parseNumber(input) {
    if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(input)) return null;
    return Number(input);
}

function parseCueTimingsAndSettings(line, regions, diagnostics, lineNumber) {
    const cue = createCue();
    let position = 0;
    const skipWhitespace = () => { while (/[\t ]/.test(line[position] || "")) position += 1; };
    skipWhitespace();
    const start = collectTimestamp(line, position);
    if (!start) return null;
    cue.startTime = start.value;
    position = start.position;
    skipWhitespace();
    if (line.slice(position, position + 3) !== "-->") return null;
    position += 3;
    skipWhitespace();
    const end = collectTimestamp(line, position);
    if (!end) return null;
    cue.endTime = end.value;
    position = end.position;
    if (position < line.length && !/[\t ]/.test(line[position])) return null;

    const seen = new Set();
    const settings = line.slice(position).trim().split(/[\t ]+/).filter(Boolean);
    for (const setting of settings) {
        const colon = setting.indexOf(":");
        const name = colon >= 0 ? setting.slice(0, colon) : "align";
        const value = colon >= 0 ? setting.slice(colon + 1) : setting;
        if (seen.has(name)) diagnostic(diagnostics, "DUPLICATE_CUE_SETTING", `Duplicate cue setting: ${name}`, lineNumber);
        seen.add(name);
        let valid = true;
        switch (name) {
        case "region": {
            const match = [...(regions || [])].reverse().find(region => region.id === value);
            cue.region = match || null;
            break;
        }
        case "vertical":
            valid = value === "rl" || value === "lr";
            if (valid) { cue.vertical = value; cue.region = null; }
            break;
        case "line": {
            const parts = value.split(",");
            if (parts.length > 2) { valid = false; break; }
            let lineAlign = cue.lineAlign;
            if (parts.length === 2) {
                valid = ["start", "center", "end"].includes(parts[1]);
                if (!valid) break;
                lineAlign = parts[1];
            }
            const percentage = parsePercentage(parts[0]);
            if (percentage !== null) {
                cue.line = percentage;
                cue.snapToLines = false;
            } else {
                const number = parseNumber(parts[0]);
                valid = number !== null;
                if (valid) { cue.line = number; cue.snapToLines = true; }
            }
            if (valid) { cue.lineAlign = lineAlign; cue.region = null; }
            break;
        }
        case "position": {
            const parts = value.split(",");
            if (parts.length > 2) { valid = false; break; }
            const percentage = parsePercentage(parts[0]);
            valid = percentage !== null && (parts.length === 1 || ["line-left", "center", "line-right"].includes(parts[1]));
            if (valid) { cue.position = percentage; cue.positionAlign = parts[1] || "auto"; }
            break;
        }
        case "size": {
            const percentage = parsePercentage(value);
            valid = percentage !== null;
            if (valid) { cue.size = percentage; if (percentage !== 100) cue.region = null; }
            break;
        }
        case "align":
            valid = ["start", "center", "end", "left", "right"].includes(value);
            if (valid) cue.align = value;
            break;
        default:
            valid = false;
        }
        if (!valid) diagnostic(diagnostics, "INVALID_CUE_SETTING", `Invalid cue setting: ${setting}`, lineNumber);
    }
    return cue;
}

module.exports = { parseRegionSettings, parseCueTimingsAndSettings };
