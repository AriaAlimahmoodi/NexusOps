"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DismissBannerRequestDto = void 0;
const banner_name_schema_1 = require("../../schemas/banner-name.schema");
const zod_class_1 = require("../../zod-class");
class DismissBannerRequestDto extends zod_class_1.Z.class({
    banner: banner_name_schema_1.bannerNameSchema.optional(),
}) {
}
exports.DismissBannerRequestDto = DismissBannerRequestDto;
//# sourceMappingURL=dismiss-banner-request.dto.js.map