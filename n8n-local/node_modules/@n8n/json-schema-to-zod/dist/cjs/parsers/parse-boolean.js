"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBoolean = void 0;
const zod_1 = require("zod");
const parseBoolean = (_jsonSchema) => {
    return zod_1.z.boolean();
};
exports.parseBoolean = parseBoolean;
