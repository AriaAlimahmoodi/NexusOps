"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConst = void 0;
const zod_1 = require("zod");
const parseConst = (jsonSchema) => {
    return zod_1.z.literal(jsonSchema.const);
};
exports.parseConst = parseConst;
