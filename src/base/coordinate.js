"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Coordinate {
    static parse(coord) {
        coord = coord.trim();
        let result = new Coordinate();
        // ~15 signifies relative position, just like Minecraft
        if (coord[0] == '~') {
            result.relative = true;
            // cut off ~
            coord = coord.substr(1);
        }
        else {
            result.relative = false;
        }
        result.coord = Number(coord);
        return result;
    }
}
exports.Coordinate = Coordinate;
//# sourceMappingURL=coordinate.js.map