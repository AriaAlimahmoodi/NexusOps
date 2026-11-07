"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shapeToStandardSchema = shapeToStandardSchema;
const json_schema_1 = require("@n8n/ai-utilities/json-schema");
const zod_1 = require("zod");
function shapeToStandardSchema(shape) {
    const schema = zod_1.z.object(shape);
    const jsonSchema = (0, json_schema_1.zodToDraft202012)(schema, { $refStrategy: 'none' });
    return {
        '~standard': {
            version: 1,
            vendor: 'n8n-zod-classic',
            validate: (value) => {
                const result = schema.safeParse(value);
                return result.success
                    ? { value: result.data }
                    : {
                        issues: result.error.issues.map((issue) => ({
                            message: issue.message,
                            path: issue.path,
                        })),
                    };
            },
            jsonSchema: {
                input: () => jsonSchema,
                output: () => jsonSchema,
            },
        },
    };
}
//# sourceMappingURL=tool-schema.util.js.map