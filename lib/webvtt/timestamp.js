"use strict";

function parsePercentage(input) {
    if (typeof input !== "string" || !/^\d+(?:\.\d+)?%$/.test(input)) {
        return null;
    }
    const value = Number(input.slice(0, -1));
    return value <= 100 ? value : null;
}

function collectDigits(input, position) {
    const start = position;
    while (position < input.length && input.charCodeAt(position) >= 48 && input.charCodeAt(position) <= 57) {
        position += 1;
    }
    return position === start ? null : { text: input.slice(start, position), position };
}

function collectTimestamp(input, position) {
    if (typeof input !== "string" || !Number.isInteger(position) || position < 0 || position > input.length) {
        return null;
    }

    const first = collectDigits(input, position);
    if (!first || input[first.position] !== ":") {
        return null;
    }

    const second = collectDigits(input, first.position + 1);
    if (!second) {
        return null;
    }

    let hours = 0;
    let minutes;
    let seconds;
    let cursor = second.position;

    if (input[cursor] === ":") {
        if (second.text.length !== 2) {
            return null;
        }
        hours = Number(first.text);
        minutes = Number(second.text);
        const third = collectDigits(input, cursor + 1);
        if (!third || third.text.length !== 2) {
            return null;
        }
        seconds = Number(third.text);
        cursor = third.position;
    } else {
        if (first.text.length !== 2 || second.text.length !== 2) {
            return null;
        }
        minutes = Number(first.text);
        seconds = Number(second.text);
    }

    if (input[cursor] !== ".") {
        return null;
    }
    const milliseconds = collectDigits(input, cursor + 1);
    if (!milliseconds || milliseconds.text.length !== 3) {
        return null;
    }

    if (minutes > 59 || seconds > 59) {
        return null;
    }

    const value = hours * 3600 + minutes * 60 + seconds + Number(milliseconds.text) / 1000;
    return { value, position: milliseconds.position };
}

function parseTimestamp(input) {
    const result = collectTimestamp(input, 0);
    return result && result.position === input.length ? result.value : null;
}

module.exports = { parsePercentage, collectTimestamp, parseTimestamp };
