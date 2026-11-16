"use strict";

const PLAY_RES_X = 1920;
const PLAY_RES_Y = 1080;
const ESTIMATED_LINE_HEIGHT = 60;

function diagnostic(context, code, message) {
    if (context && context.diagnostics) context.diagnostics.push({ level: "warning", code, message, line: 1, column: 1 });
}

function horizontalAlignment(value) {
    if (value === "left" || value === "start") return 1;
    if (value === "right" || value === "end") return 3;
    return 2;
}

function verticalAlignment(value) {
    if (value === "start") return "top";
    if (value === "end") return "bottom";
    return "middle";
}

function combineAlignment(horizontal, vertical) {
    const column = horizontal === "left" ? 1 : horizontal === "right" ? 3 : 2;
    const row = vertical === "top" ? 2 : vertical === "middle" ? 1 : 0;
    return row * 3 + column;
}

function resolveSnapLinePosition(cue) {
    if (cue.line === "auto" || typeof cue.line !== "number") return null;
    if (cue.line >= 0) return Math.round(30 + cue.line * ESTIMATED_LINE_HEIGHT);
    return Math.round(PLAY_RES_Y - 30 - (Math.abs(cue.line) - 1) * ESTIMATED_LINE_HEIGHT);
}

function resolveCueLayout(cue, context) {
    const result = { alignment: horizontalAlignment(cue.align), marginL: 0, marginR: 0, marginV: 0, tags: [] };
    if (cue.vertical !== "horizontal") {
        diagnostic(context, "UNSUPPORTED_VERTICAL_LAYOUT", `Vertical cue layout ${cue.vertical} is approximated as horizontal`);
    }
    if (cue.size !== 100) {
        const margin = Math.round(PLAY_RES_X * (100 - cue.size) / 200);
        result.marginL = margin;
        result.marginR = margin;
        diagnostic(context, "APPROXIMATE_CUE_SIZE", "Cue size is approximated with horizontal margins");
    }

    if (cue.region) {
        const region = cue.region;
        const anchorX = region.regionAnchor.x;
        const anchorY = region.regionAnchor.y;
        const alignX = anchorX < 33.333 ? "left" : anchorX > 66.667 ? "right" : "center";
        const alignY = anchorY < 33.333 ? "top" : anchorY > 66.667 ? "bottom" : "middle";
        const x = Math.round(region.viewportAnchor.x * PLAY_RES_X / 100);
        const y = Math.round(region.viewportAnchor.y * PLAY_RES_Y / 100);
        result.alignment = combineAlignment(alignX, alignY);
        result.tags.push(`\\pos(${x},${y})`);
        const available = Math.round(PLAY_RES_X * region.width / 100);
        const offset = Math.round((PLAY_RES_X - available) / 2);
        result.marginL = Math.max(result.marginL, offset);
        result.marginR = Math.max(result.marginR, offset);
        if (region.scroll === "up") diagnostic(context, "UNSUPPORTED_REGION_SCROLL", "Region scroll:up animation is not represented in ASS");
        return result;
    }

    const horizontal = cue.position === "auto" ? null : Math.round(cue.position * PLAY_RES_X / 100);
    const vertical = cue.snapToLines ? resolveSnapLinePosition(cue) : Math.round(cue.line * PLAY_RES_Y / 100);
    if (horizontal !== null || vertical !== null) {
        const defaultPositionAlign = cue.align === "left" || cue.align === "start" ? "left" :
            cue.align === "right" || cue.align === "end" ? "right" : "center";
        const alignX = cue.positionAlign === "line-left" ? "left" : cue.positionAlign === "line-right" ? "right" :
            cue.positionAlign === "center" ? "center" : defaultPositionAlign;
        const alignY = cue.snapToLines ? (cue.line < 0 ? "bottom" : "top") : verticalAlignment(cue.lineAlign);
        result.alignment = combineAlignment(alignX, alignY);
        const x = horizontal === null ? Math.round(PLAY_RES_X / 2) : horizontal;
        const y = vertical === null ? PLAY_RES_Y - 30 : vertical;
        result.tags.push(`\\pos(${x},${y})`);
    }
    return result;
}

module.exports = { PLAY_RES_X, PLAY_RES_Y, resolveSnapLinePosition, resolveCueLayout };
