var he = require('he');

var r_voice = /<v[^\s]* (.+?)>(.*)/;
var r_tag_l = /<([^\.]+?)(\..+?)?>/;
var r_tag_r = /<\/([^\.]+?)>/;

function getVoice(text) {
    var ret = r_voice.exec(text);
    if (ret !== null) {
        return { voice: ret[1], text : ret[2] };
    }
    return { voice: 'Default', text : text };
}

function parseStyle(text) {
    text = text.replace(r_tag_l, "{\\"+ "$1" +"1}");
    text = text.replace(r_tag_r, "{\\"+ "$1" +"0}");
    return text;
}

function parseText(item) {
    var voiceAndText = getVoice(item.text);
    var text = voiceAndText.text;
    text = parseStyle(text).replace('\n', '\\N');
    text = he.decode(text);
    return { voice: voiceAndText.voice, text: text };
}

module.exports = parseText;
