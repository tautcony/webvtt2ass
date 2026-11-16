"use strict";

const timestamp = require("./timestamp");

module.exports = Object.assign({}, timestamp, require("./parser"), require("./cue-text"));
