var _ = require('underscore');

var r_voice = /<v[^\s]* (.+?)>(.*)/;

function getVoice(text) {
    var ret = r_voice.exec(text);
    if (ret !== null) {
        return { voice: ret[1], text : ret[2] };
    }
    return { voice: 'Default', text : text };
}

function parseStyle(text) {
    text = text.replace('<b>' , '{\\b1}');
    text = text.replace('</b>', '{\\b0}');
    text = text.replace('<i>' , '{\\i1}');
    text = text.replace('</i>', '{\\i0}');
    text = text.replace('<u>' , '{\\u1}');
    text = text.replace('</u>', '{\\u0}');
    return text;
}

function parseText(item) {
    var voiceAndText = getVoice(item.text);
    var text = voiceAndText.text;
    text = parseStyle(text).replace('\n', '\\N');
    text = _.unescape(text);
    return { voice: voiceAndText.voice, text: text };
}

module.exports = parseText;
