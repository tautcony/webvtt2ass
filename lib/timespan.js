/**
* Class that handles time related operations.
* It is very similar to .NET's TimeSpan class
* Find reference and documentation at: http://menendezpoo.com
version 1.3
*/
function TimeSpan(){
    var days = 0;
    var hours = 0;
    var minutes = 0;
    var seconds = 0;
    var milliseconds = 0;

    switch(arguments.length){
        case 0:
            break;
        case 1:
            milliseconds = arguments[0];
            break;
        case 2:
            days = arguments[0];
            hours = arguments[1];
            break;
        case 3:
            hours = arguments[0];
            minutes = arguments[1];
            seconds = arguments[2];
            break;
        case 4:
            days = arguments[0];
            hours = arguments[1];
            minutes = arguments[2];
            seconds = arguments[3];
            break;
        case 5:
            days = arguments[0];
            hours = arguments[1];
            minutes = arguments[2];
            seconds = arguments[3];
            milliseconds = arguments[4];
            break;
        default:
            throw("No constructor of TimeSpan supports " + arguments.length + " arguments");
    }

    this._millis = (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;

};

TimeSpan.prototype = {
    /* Methods */
    add : function(timespan){
        return new TimeSpan(timespan._millis + this._millis);
    },

    compareTo : function(timespan){
        if(this._millis > timespan._millis) return 1;
        if(this._millis == timespan._millis) return 0;
        if(this._millis < timespan._millis) return -1;
    },

    duration : function(){
        return new TimeSpan(Math.abs(this._millis));
    },

    equals : function(timespan){
        return this._millis == timespan._millis;
    },

    negate : function(){
        this._millis *= -1;
    },

    subtract : function(timespan){
        return new TimeSpan(this._millis - timespan._millis);
    },

    rounder : function(number){
        if(this._millis < 0)
            return Math.ceil(number);
        return Math.floor(number);
    },

    /* Properties */

    days : function(){ return this.rounder(this._millis / (24 * 3600 * 1000) ); },

    hours : function(){ return this.rounder( (this._millis % (24 * 3600 * 1000)) / (3600 * 1000)); },

    milliseconds : function(){ return this.rounder(this._millis % 1000); },

    minutes : function(){ return this.rounder( (this._millis % (3600 * 1000)) / (60 * 1000)); },

    seconds : function(){ return this.rounder((this._millis % 60000) / 1000); },

    totalDays : function(){ return this._millis / (24 * 3600 * 1000); },

    totalHours : function(){ return this._millis / (3600 * 1000); },

    totalMinutes : function(){ return this._millis / (60 * 1000); },

    totalSeconds : function(){ return this._millis / 1000; },

    totalMilliseconds : function(){ return this._millis; },

    toString : function(){
        return (this._millis < 0 ? "-" : "") +
        (Math.abs(this.days()) ? TimeSpan.padLeft(Math.abs(this.days()))  + ".": "") +
        TimeSpan.padLeft(Math.abs(this.hours())) + ":" +
        TimeSpan.padLeft(Math.abs(this.minutes())) + ":" +
        TimeSpan.padLeft(Math.abs(this.seconds())) + "." +
        TimeSpan.padRight(Math.abs(this.milliseconds()));
    },
    
    assFormat : function(){
        return (this._millis < 0 ? "-" : "") +
        (Math.abs(this.days()) ? TimeSpan.padLeft(Math.abs(this.days()))  + ".": "") +
        TimeSpan.padLeft(Math.abs(this.hours())) + ":" +
        TimeSpan.padLeft(Math.abs(this.minutes())) + ":" +
        TimeSpan.padLeft(Math.abs(this.seconds())) + "." +
        TimeSpan.padRight(Math.round(Math.abs(this.milliseconds())/10));
    }
};

TimeSpan.padLeft = function(number, length) {
    length = typeof length !== 'undefined' ? length : 2;
    number = '' + number;
    while (number.length < length) {
        number = '0' + number;
    }
    return number;
};
TimeSpan.padRight = function(number, length) {
    length = typeof length !== 'undefined' ? length : 3;
    number = '' + number;
    while (number.length < length) {
        number += '0';
    }
    return number;
};

module.exports = TimeSpan;
