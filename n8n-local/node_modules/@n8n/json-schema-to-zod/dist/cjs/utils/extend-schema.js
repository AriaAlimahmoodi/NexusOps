"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendSchemaWithMessage = extendSchemaWithMessage;
function extendSchemaWithMessage(zodSchema, jsonSchema, key, extend) {
    const value = jsonSchema[key];
    if (value !== undefined) {
        const errorMessage = jsonSchema.errorMessage?.[key];
        return extend(zodSchema, value, errorMessage);
    }
    return zodSchema;
}
