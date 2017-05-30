"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coordinate_1 = require("./coordinate");
class BlockPos {
    constructor(input) {
        this.toParse = input;
    }
    requiredParser() {
        return BlockPosParser.name;
    }
}
exports.BlockPos = BlockPos;
class BlockPosParser {
    parse(obj) {
        let pos = obj;
        if (pos.toParse == null) {
            return pos.toParse;
        }
        let xyz = pos.toParse.split(' ');
        if (xyz.length != 3) {
            return null;
        }
        let coordKeys = ['x', 'y', 'z'];
        let relativeKeys = ['xrelative', 'yrelative', 'zrelative'];
        for (let i = 0; i < 3; ++i) {
            let coord = coordinate_1.Coordinate.parse(xyz[i]);
            pos[coordKeys[i]] = coord.coord;
            pos[relativeKeys[i]] = coord.relative;
        }
        // Clear this so it doesn't show up when jsonified
        pos.toParse = undefined;
        return pos;
    }
}
exports.BlockPosParser = BlockPosParser;
//# sourceMappingURL=blockPosParser.js.map