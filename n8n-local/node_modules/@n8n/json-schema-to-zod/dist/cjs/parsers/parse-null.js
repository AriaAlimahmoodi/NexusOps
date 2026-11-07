"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNull = void 0;
const zod_1 = require("zod");
const parseNull = (_jsonSchema) => {
    return zod_1.z.null();
};
exports.parseNull = parseNull;
