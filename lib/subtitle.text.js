var he = require('he');
var TimeSpan  = require('./timespan');

var r_voice = /<v[^\s]* (.+?)>(.*)/;
var r_tag_l = /<([^\.]+?)(\..+?)?>/;
var r_tag_r = /<\/([^\.]+?)>/;

var default_font = '方正准圆_GBK';

function assHead() {
    'use strict';
    var ret = '[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n\n' +
    '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n' +
    'Style: Default,' + default_font + ',50,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0.5,2,10,10,10,1\n\n' +
    '[Events]\nFormat: Layer, Start, End, Style, Actor, MarginL, MarginR, MarginV, Effect, Text\n' +
    'Comment: 0,0:00:00.00,0:00:00.00,Default,,0,0,0,template furi,{\pos(!line.left+syl.center!,!line.middle-line.height!)\an5}\n' +
    'Comment: 0,0:00:00.00,0:00:00.00,Default,,0,0,0,template syl,{\pos(!line.left+syl.center!,!line.middle!)\an5}\n';
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

//src: <ruby>明日<rt>あした</tr></ruby>また<ruby>会<rt>あう</rt></ruby><ruby>時<rt>とき</rt></ruby>
//tgt: {\k}明日|あした{\k}また{\k}会|あう{\k}時|とき
//ref: http://docs.aegisub.org/manual/Furigana_karaoke

function parseTreeRuby(tree) {
    var ret = '{\\k}';
    tree.children.forEach(item => {
        if (item.type === 'text') {
            ret += item.value;
        } else if (item.type === 'object') {
            if (item.name === 'rt') {
                ret += '|' + parseTreeInner(item, true).text;
                ret += '{\\k}';
            }
        }
    });
    return ret;
}

function parseTreeInner(tree, noTag) {
    'use strict';
    var nodes = tree.children;
    //console.log(nodes);
    var ret = {};
    ret.text = '';
    if (tree.name === 'v') {
        ret.voice = tree.value;
    } else if (tree.name === 'ruby') {
        ret.text += parseTreeRuby(tree);
        //console.log(tree);
    } else {
        nodes.forEach(item => {
            if (item.type === 'object') {
                var temp = parseTreeInner(item);
                ret.text += temp.text.replace('\n', '\\N');
                if (ret.voice === undefined) {
                    ret.voice = temp.voice;
                }
            } else {
                ret.text += item.value.replace('\n', '\\N');
            }
        });
        if (tree.name !== undefined && noTag === undefined) {
            if (tree.name !== 'v') {
                ret.text = "{\\" + tree.name + "1}" + ret.text + "{\\" + tree.name + "0}";
            }
        }
    }
    return ret;
}

function parsePosition(line) {
    var an = 2;
    if (line.alignment === 'end') {
        an = 3;
    } else if (line.alignment === 'start') {
        an = 1;
    }
    var isHorizontal = line.horizontal === 'horizontal';
}

function parseSegment(line) {
    'use strict';
    var ret = parseTreeInner(line.tree);
    if (ret.voice === undefined) {
        ret.voice = 'Default';
    }
    ret.text = he.decode(ret.text);
    ret.begin = new TimeSpan(line.startTime).assFormat();
    ret.end   = new TimeSpan(line.endTime).assFormat();
    return ret;
}

module.exports = { parseText: parseText, parseSegment: parseSegment, assHead: assHead };
