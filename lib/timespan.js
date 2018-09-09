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
    this.milliseconds  = Math.round(seconds * 1000);
    this.hours         = Math.floor((this.milliseconds / (3600 * 1000)));
    this.minutes       = Math.floor((this.milliseconds % (3600 * 1000)) / (60 * 1000));
    this.seconds       = Math.floor((this.milliseconds % 60000) / 1000);
    this.milliseconds %= 1000;

    this.toString = function () {
        return `${padLeft(this.hours)}:${padLeft(this.minutes)}:${padLeft(this.seconds)}.${padLeft(Math.round(Math.abs(this.milliseconds / 10)))}`;
    };
}

module.exports = TimeSpan;
