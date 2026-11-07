"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFavoriteDto = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
class AddFavoriteDto extends api_types_1.Z.class({
    resourceId: zod_1.z.string(),
    resourceType: zod_1.z.enum(api_types_1.FAVORITE_RESOURCE_TYPES),
}) {
}
exports.AddFavoriteDto = AddFavoriteDto;
//# sourceMappingURL=add-favorite.dto.js.map