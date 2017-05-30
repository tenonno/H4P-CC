"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Optional {
    constructor(val) {
        this.value = val;
    }
    requiredParser() {
        return OptionalParser.name;
    }
}
exports.Optional = Optional;
class OptionalParser {
    parse(obj) {
        let opt = obj;
        return opt.value;
    }
}
exports.OptionalParser = OptionalParser;
//# sourceMappingURL=optionalParser.js.map