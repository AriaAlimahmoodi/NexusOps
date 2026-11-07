"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerNameSchema = exports.dynamicBannerNameSchema = exports.staticBannerNameSchema = void 0;
const zod_1 = require("zod");
exports.staticBannerNameSchema = zod_1.z.enum([
    'V1',
    'TRIAL_OVER',
    'TRIAL',
    'NON_PRODUCTION_LICENSE',
    'EMAIL_CONFIRMATION',
    'DATA_TABLE_STORAGE_LIMIT_WARNING',
    'DATA_TABLE_STORAGE_LIMIT_ERROR',
    'WORKFLOW_AUTO_DEACTIVATED',
]);
exports.dynamicBannerNameSchema = zod_1.z.string().regex(/^dynamic-banner-\d+$/);
exports.bannerNameSchema = zod_1.z.union([exports.staticBannerNameSchema, exports.dynamicBannerNameSchema]);
//# sourceMappingURL=banner-name.schema.js.map