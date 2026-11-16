"use strict";

const COLORS = {
    white: "FFFFFF",
    lime: "00FF00",
    cyan: "00FFFF",
    red: "FF0000",
    yellow: "FFFF00",
    magenta: "FF00FF",
    blue: "0000FF",
    black: "000000"
};

const FOREGROUND_CLASSES = Object.fromEntries(Object.entries(COLORS).map(([name, rgb]) => [name, rgb]));
const BACKGROUND_CLASSES = Object.fromEntries(Object.entries(COLORS).map(([name, rgb]) => [`bg_${name}`, rgb]));

function rgbToAssColor(rgb) {
    return `&H${rgb.slice(4, 6)}${rgb.slice(2, 4)}${rgb.slice(0, 2)}&`;
}

module.exports = { COLORS, FOREGROUND_CLASSES, BACKGROUND_CLASSES, rgbToAssColor };
