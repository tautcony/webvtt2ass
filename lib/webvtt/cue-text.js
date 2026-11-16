"use strict";

const he = require("he");
const { parseTimestamp } = require("./timestamp");

function decodeCharacterReferences(value) {
    return value.includes("&") ? he.decode(value) : value;
}

function tokenizeCueText(input) {
    const tokens = [];
    let position = 0;
    const text = String(input);
    while (position < text.length) {
        if (text[position] !== "<") {
            const start = position;
            while (position < text.length && text[position] !== "<") position += 1;
            tokens.push({ type: "text", value: decodeCharacterReferences(text.slice(start, position)) });
            continue;
        }

        const end = text.indexOf(">", position + 1);
        if (end < 0) {
            tokens.push({ type: "text", value: decodeCharacterReferences(text.slice(position)) });
            break;
        }
        const raw = text.slice(position + 1, end);
        const timestamp = parseTimestamp(raw);
        if (timestamp !== null) {
            tokens.push({ type: "timestamp", value: raw });
            position = end + 1;
            continue;
        }
        const close = /^\/([a-z]+)$/i.exec(raw);
        if (close) {
            tokens.push({ type: "endTag", name: close[1].toLowerCase() });
            position = end + 1;
            continue;
        }
        const startTag = /^([a-z]+)((?:\.[^\s.<>]+)*)(?:[\t ]+([\s\S]*))?$/i.exec(raw);
        if (startTag) {
            const classes = startTag[2] ? startTag[2].slice(1).split(".") : [];
            tokens.push({
                type: "startTag",
                name: startTag[1].toLowerCase(),
                classes,
                annotation: startTag[3] ? decodeCharacterReferences(startTag[3].trim()) : ""
            });
            position = end + 1;
            continue;
        }
        // Invalid/unknown markup is ignored as a tag. Its surrounding text stays intact.
        position = end + 1;
    }
    return tokens;
}

const tagTypes = {
    c: "class", i: "italic", b: "bold", u: "underline",
    ruby: "ruby", rt: "rubyText", v: "voice", lang: "lang"
};

function parseCueText(input) {
    const root = { type: "root", children: [] };
    let current = root;
    const stack = [];
    const languages = [];
    for (const token of tokenizeCueText(input)) {
        if (token.type === "text") {
            current.children.push({ type: "text", value: token.value });
            continue;
        }
        if (token.type === "timestamp") {
            current.children.push({ type: "timestamp", value: parseTimestamp(token.value) });
            continue;
        }
        if (token.type === "startTag") {
            const type = tagTypes[token.name];
            if (!type || (token.name === "rt" && current.type !== "ruby")) continue;
            const node = {
                type,
                classes: token.classes,
                language: languages.length ? languages[languages.length - 1] : null,
                children: []
            };
            if (token.name === "v") node.value = token.annotation;
            if (token.name === "lang") {
                node.value = token.annotation;
                node.language = token.annotation;
                languages.push(token.annotation);
            }
            current.children.push(node);
            stack.push({ node, tag: token.name });
            current = node;
            continue;
        }
        const expected = tagTypes[token.name];
        if (!expected || !stack.length) continue;
        if (current.type === "rubyText" && token.name === "ruby" && stack[stack.length - 2] && stack[stack.length - 2].tag === "ruby") {
            stack.pop();
            stack.pop();
            current = stack.length ? stack[stack.length - 1].node : root;
            continue;
        }
        if (current.type !== expected) continue;
        const closed = stack.pop();
        if (closed.tag === "lang") languages.pop();
        current = stack.length ? stack[stack.length - 1].node : root;
    }
    return root;
}

module.exports = { tokenizeCueText, parseCueText };
