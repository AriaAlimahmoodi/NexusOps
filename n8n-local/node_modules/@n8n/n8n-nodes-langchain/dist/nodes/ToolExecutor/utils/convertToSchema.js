"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertObjectBySchema = exports.convertValueBySchema = void 0;
const zod_1 = require("zod");
const convertValueBySchema = (value, schema) => {
    if (!schema || !value)
        return value;
    if (typeof value === 'string') {
        if (schema instanceof zod_1.z.ZodNumber) {
            return Number(value);
        }
        else if (schema instanceof zod_1.z.ZodBoolean) {
            return value.toLowerCase() === 'true';
        }
        else if (schema instanceof zod_1.z.ZodObject) {
            try {
                const parsed = JSON.parse(value);
                return (0, exports.convertValueBySchema)(parsed, schema);
            }
            catch {
                return value;
            }
        }
    }
    if (schema instanceof zod_1.z.ZodObject && typeof value === 'object' && value !== null) {
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            const fieldSchema = schema.shape[key];
            if (fieldSchema) {
                result[key] = (0, exports.convertValueBySchema)(val, fieldSchema);
            }
            else {
                result[key] = val;
            }
        }
        return result;
    }
    return value;
};
exports.convertValueBySchema = convertValueBySchema;
const convertObjectBySchema = (obj, schema) => {
    return (0, exports.convertValueBySchema)(obj, schema);
};
exports.convertObjectBySchema = convertObjectBySchema;
//# sourceMappingURL=convertToSchema.js.map