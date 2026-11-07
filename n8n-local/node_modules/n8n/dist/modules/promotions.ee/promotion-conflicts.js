"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPromotionConflicts = mapPromotionConflicts;
const errors_1 = require("@n8n/errors");
const promotion_conflict_error_1 = require("./database/promotion-conflict.error");
async function mapPromotionConflicts(run) {
    try {
        return await run();
    }
    catch (error) {
        if (error instanceof promotion_conflict_error_1.PromotionConflictError)
            throw new errors_1.ConflictError(error.message);
        throw error;
    }
}
//# sourceMappingURL=promotion-conflicts.js.map