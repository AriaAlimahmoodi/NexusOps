"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booleanFromString = void 0;
const zod_1 = require("zod");
exports.booleanFromString = zod_1.z.enum(['true', 'false']).transform((value) => value === 'true');
//# sourceMappingURL=boolean-from-string.js.map