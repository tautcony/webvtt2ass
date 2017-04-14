function padLeft(number, length) {
    "use strict";
    length = length !== undefined ? length : 2;
    number = String(number);
    while (number.length < length) {
        number = '0' + number;
    }
    return number;
}

function padRight(number, length) {
    "use strict";
    length = length !== undefined ? length : 3;
    number = String(number);
    while (number.length < length) {
        number += '0';
    }
    return number;
}

function TimeSpan(seconds) {
    "use strict";
    this.milliseconds  = Math.round(seconds * 1000);
    this.hours         = Math.floor((this.milliseconds / (3600 * 1000)));
    this.minutes       = Math.floor((this.milliseconds % (3600 * 1000)) / (60 * 1000));
    this.seconds       = Math.floor((this.milliseconds % 60000) / 1000);
    this.milliseconds %= 1000;

    this.assFormat = function () {
        return padLeft(this.hours) + ':' +
            padLeft(this.minutes) + ':' +
            padLeft(this.seconds) + '.' +
            padLeft(Math.round(Math.abs(this.milliseconds / 10)), 2);
    };
}

module.exports = TimeSpan;
