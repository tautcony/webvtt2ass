"use strict";
function padLeft(number, length) {
    length = length !== undefined ? length : 2;
    number = String(number);
    while (number.length < length) {
        number = "0" + number;
    }
    return number;
}

function isNumeric (input) {
    return !isNaN(parseFloat(input)) && isFinite(input);
}

function TimeSpan(seconds) {
    if (!isNumeric(seconds)) {
        return;
    }

    const roundedHundredths = Math.round(seconds * 100);
    const roundedSeconds = Math.floor(roundedHundredths / 100);
    
    this.hundredths = roundedHundredths % 100;
    this.seconds = roundedSeconds % 60;
    this.minutes = Math.floor(roundedSeconds / 60) % 60;
    this.hours = Math.floor(roundedSeconds / 3600);

    if (this.hours > 9) {
        console.warn(`[Warning] time in ASS format only support up to 9:59:59.99`);
    }

    this.toString = function () {
        return `${padLeft(this.hours, 1)}:${padLeft(this.minutes)}:${padLeft(this.seconds)}.${padLeft(this.hundredths)}`;
    };
}

module.exports = TimeSpan;
