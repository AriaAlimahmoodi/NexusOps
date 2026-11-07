"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsGetManyRequestQuery = void 0;
const zod_1 = __importDefault(require("zod"));
const boolean_from_string_1 = require("../../schemas/boolean-from-string");
const zod_class_1 = require("../../zod-class");
class CredentialsGetManyRequestQuery extends zod_class_1.Z.class({
    includeScopes: boolean_from_string_1.booleanFromString.optional(),
    includeData: boolean_from_string_1.booleanFromString.optional(),
    onlySharedWithMe: boolean_from_string_1.booleanFromString.optional(),
    includeGlobal: boolean_from_string_1.booleanFromString.optional().default('false'),
    externalSecretsStore: zod_1.default.string().optional(),
}) {
}
exports.CredentialsGetManyRequestQuery = CredentialsGetManyRequestQuery;
//# sourceMappingURL=credentials-get-many-request.dto.js.map