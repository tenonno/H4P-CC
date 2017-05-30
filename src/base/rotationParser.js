"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coordinate_1 = require("./coordinate");
class Rotation {
    constructor(input) {
        this.toParse = input;
    }
    requiredParser() {
        return RotationParser.name;
    }
}
exports.Rotation = Rotation;
class RotationParser {
    parserName() {
        return RotationParser.name;
    }
    parse(obj) {
        let rot = obj;
        if (rot.toParse == null) {
            return rot.toParse;
        }
        let coord = coordinate_1.Coordinate.parse(rot.toParse);
        rot.rotation = coord.coord;
        rot.relative = coord.relative;
        // Clear this so it doesn't show up when jsonified
        rot.toParse = undefined;
        return rot;
    }
}
exports.RotationParser = RotationParser;
//# sourceMappingURL=rotationParser.js.map