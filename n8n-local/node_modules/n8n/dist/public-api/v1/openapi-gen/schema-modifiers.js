"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySchemaModifiers = applySchemaModifiers;
const object_union_type_1 = require("./object-union-type");
const untyped_nullable_1 = require("./untyped-nullable");
const SCHEMA_MODIFIERS = [untyped_nullable_1.stripUntypedNullable, object_union_type_1.addObjectTypeToObjectUnions];
function applySchemaModifiers(node) {
    for (const modify of SCHEMA_MODIFIERS) {
        modify(node);
    }
}
//# sourceMappingURL=schema-modifiers.js.map