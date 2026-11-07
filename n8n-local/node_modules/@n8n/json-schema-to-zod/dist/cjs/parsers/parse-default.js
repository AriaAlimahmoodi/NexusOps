"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDefault = void 0;
const zod_1 = require("zod");
const parseDefault = (_jsonSchema) => {
    return zod_1.z.any();
};
exports.parseDefault = parseDefault;
