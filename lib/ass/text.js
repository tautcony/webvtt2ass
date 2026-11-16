"use strict";

const { FOREGROUND_CLASSES, BACKGROUND_CLASSES, rgbToAssColor } = require("../webvtt/style");

function escapeAssLine(line) {
    return line
        .replace(/\\/g, "\\\\")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}");
}

function escapeAssText(value) {
    const lines = String(value).split("\n");
    return lines.length === 1 ? escapeAssLine(lines[0]) : lines.map(escapeAssLine).join("\\N");
}

function classesToTags(classes, context) {
    let foreground = null;
    let background = null;
    for (const name of classes) {
        if (FOREGROUND_CLASSES[name]) foreground = FOREGROUND_CLASSES[name];
        else if (BACKGROUND_CLASSES[name]) background = BACKGROUND_CLASSES[name];
        else if (context && context.diagnostics) {
            context.diagnostics.push({ level: "warning", code: "UNSUPPORTED_STYLE_CLASS", message: `Unsupported style class: ${name}`, line: 1, column: 1 });
        }
    }
    const tags = [];
    if (foreground) tags.push(`\\c${rgbToAssColor(foreground)}`);
    if (background) tags.push(`\\4c${rgbToAssColor(background)}`);
    return { tags, foreground, background };
}

function renderNodes(nodes, context, inherited) {
    let output = "";
    const style = inherited || { foreground: null, background: null };
    for (const node of nodes || []) {
        if (node.type === "text") {
            output += escapeAssText(node.value);
        } else if (node.type === "timestamp") {
            continue;
        } else if (["bold", "italic", "underline"].includes(node.type)) {
            const tag = node.type === "bold" ? "b" : node.type === "italic" ? "i" : "u";
            output += `{\\${tag}1}${renderNodes(node.children, context, style)}{\\${tag}0}`;
        } else if (node.type === "class") {
            const result = classesToTags(node.classes || [], context);
            const next = {
                foreground: result.foreground || style.foreground,
                background: result.background || style.background
            };
            const open = result.tags.length ? `{${result.tags.join("")}}` : "";
            const restore = [];
            if (result.foreground) restore.push(`\\c${style.foreground ? rgbToAssColor(style.foreground) : "&H00FFFFFF&"}`);
            if (result.background) restore.push(`\\4c${style.background ? rgbToAssColor(style.background) : "&H00000000&"}`);
            output += open + renderNodes(node.children, context, next) + (restore.length ? `{${restore.join("")}}` : "");
        } else if (node.type === "ruby") {
            const bases = [];
            const rubyText = [];
            for (const child of node.children || []) {
                if (child.type === "rubyText") rubyText.push(child);
                else bases.push(child);
            }
            const base = renderNodes(bases, context, style);
            const rt = renderNodes(rubyText.flatMap(item => item.children || []), context, style);
            output += `{\\k}${base}${rt ? `|${rt}` : ""}{\\k}`;
        } else if (node.type === "rubyText") {
            output += renderNodes(node.children, context, style);
        } else {
            // Voice and language add metadata only; their children remain visible.
            output += renderNodes(node.children, context, style);
        }
    }
    return output;
}

function renderCueText(root, context) {
    if (!root) return "";
    const children = root.type === "root" ? root.children : [root];
    return renderNodes(children, context, { foreground: null, background: null });
}

function getCueActor(root) {
    if (!root || root.type !== "root") return "";
    const meaningful = (root.children || []).filter(node => node.type !== "timestamp" && !(node.type === "text" && node.value === ""));
    if (meaningful.length !== 1 || meaningful[0].type !== "voice") return "";
    return hasRenderedText(meaningful[0]) ? meaningful[0].value : "";
}

function hasRenderedText(node) {
    return (node.children || []).some(child => child.type === "text" ? child.value.length > 0 : child.type !== "timestamp" && hasRenderedText(child));
}

module.exports = { renderCueText, escapeAssText, getCueActor };
