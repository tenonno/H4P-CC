"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Num {
    constructor(input) {
        this.toParse = input;
    }
    requiredParser() {
        return NumParser.name;
    }
}
exports.Num = Num;
class NumParser {
    parse(obj) {
        let num = obj;
        if (num.toParse == null) {
            return num.toParse;
        }
        let result = Number(num.toParse);
        if (Number.isNaN(result)) {
            return null;
        }
        return result;
    }
}
exports.NumParser = NumParser;
//# sourceMappingURL=numParser.js.map