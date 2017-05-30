"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function canParse(parser, parsable) {
    return parsable != null && parsable.requiredParser != null && parsable.requiredParser() === parser.constructor.name;
}
exports.canParse = canParse;
//# sourceMappingURL=iParser.js.map