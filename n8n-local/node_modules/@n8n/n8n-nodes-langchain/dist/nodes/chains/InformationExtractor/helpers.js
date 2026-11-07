"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeZodSchemaFromAttributes = makeZodSchemaFromAttributes;
const zod_1 = require("zod");
function makeAttributeSchema(attributeDefinition, required = true) {
    let schema;
    if (attributeDefinition.type === 'string') {
        schema = zod_1.z.string();
    }
    else if (attributeDefinition.type === 'number') {
        schema = zod_1.z.number();
    }
    else if (attributeDefinition.type === 'boolean') {
        schema = zod_1.z.boolean();
    }
    else if (attributeDefinition.type === 'date') {
        schema = zod_1.z.string().date();
    }
    else {
        schema = zod_1.z.unknown();
    }
    if (!required) {
        schema = schema.optional();
    }
    return schema.describe(attributeDefinition.description);
}
function makeZodSchemaFromAttributes(attributes) {
    const schemaEntries = attributes.map((attr) => [
        attr.name,
        makeAttributeSchema(attr, attr.required),
    ]);
    return zod_1.z.object(Object.fromEntries(schemaEntries));
}
//# sourceMappingURL=helpers.js.map