"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Color {
    constructor(red, green, blue) {
        this.r = red;
        this.g = green;
        this.b = blue;
    }
    // Can't be a member function because ipc seems to strip off functions
    static toStyle(c) {
        return `rgb(${c.r},${c.g},${c.b})`;
    }
    static equals(l, r) {
        return l.r === r.r && l.g === r.g && l.b === r.b;
    }
}
exports.Color = Color;
class EditorButton {
    constructor(name, link, color, active) {
        this.name = name;
        this.link = link;
        this.color = color;
        this.active = active;
    }
}
EditorButton.maxNameLength = 12;
exports.EditorButton = EditorButton;
//# sourceMappingURL=editorButton.js.map