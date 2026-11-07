"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsGetOneRequestQuery = void 0;
const boolean_from_string_1 = require("../../schemas/boolean-from-string");
const zod_class_1 = require("../../zod-class");
class CredentialsGetOneRequestQuery extends zod_class_1.Z.class({
    includeData: boolean_from_string_1.booleanFromString.optional().default('false'),
}) {
}
exports.CredentialsGetOneRequestQuery = CredentialsGetOneRequestQuery;
//# sourceMappingURL=credentials-get-one-request.dto.js.map