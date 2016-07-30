var he = require('he');

var r_voice = /<v[^\s]* (.+?)>(.*)/;
var r_tag_l = /<([^\.]+?)(\..+?)?>/;
var r_tag_r = /<\/([^\.]+?)>/;

function assHead() {
    'use strict';
    var ret = '[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n\n' +
    '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n' +
    'Style: Default,方正准圆_GBK,50,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0.5,2,10,10,10,1\n\n' +
    '[Events]\nFormat: Layer, Start, End, Style, Actor, MarginL, MarginR, MarginV, Effect, Text';
    return ret;
}

function getVoice(text) {
    'use strict';
    var ret = r_voice.exec(text);
    if (ret !== null) {
        return { voice: ret[1], text : ret[2] };
    }
    return { voice: 'Default', text : text };
}

function parseStyle(text) {
    'use strict';
    text = text.replace(r_tag_l, "{\\" + "$1" + "1}");
    text = text.replace(r_tag_r, "{\\" + "$1" + "0}");
    return text;
}

function parseText(item) {
    'use strict';
    var voiceAndText = getVoice(item.text);
    var text = voiceAndText.text;
    text = parseStyle(text).replace('\n', '\\N');
    text = he.decode(text);
    return { voice: voiceAndText.voice, text: text };
}

function parseTreeInner(tree) {
    'use strict';
    var nodes = tree.children;
    //console.log(nodes);
    var ret = {};
    ret.text = '';
    if (tree.name !== undefined) {
        if (tree.name === 'v') {
            ret.voice = tree.value;
        } else {
            ret.text += "{\\" + tree.name + "1}";
        }
    }
    nodes.forEach(item => {
        if (item.type === 'object') {
            var temp = parseTree(item);
            ret.text += temp.text.replace('\n', '\\N');
            if (ret.voice === undefined) {
                ret.voice = temp.voice;
            }
        } else {
            ret.text += item.value.replace('\n', '\\N');
        }
    });
    if (tree.name !== undefined) {
        if (tree.name !== 'v') {
            ret.text += "{\\" + tree.name + "0}";
        }
    }
    return ret;
}


function parseTree(tree) {
    'use strict';
    var ret = parseTreeInner(tree);
    if (ret.voice === undefined) {
        ret.voice = 'Default';
    }
    ret.text = he.decode(ret.text);
    return ret;
}

module.exports = { parseText: parseText, parseTree: parseTree, assHead: assHead };
