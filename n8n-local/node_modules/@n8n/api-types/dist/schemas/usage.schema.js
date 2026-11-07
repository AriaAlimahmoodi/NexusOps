"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageStateSchema = void 0;
const zod_1 = require("zod");
exports.usageStateSchema = zod_1.z.object({
    loading: zod_1.z.boolean(),
    data: zod_1.z.object({
        usage: zod_1.z.object({
            activeWorkflowTriggers: zod_1.z.object({
                limit: zod_1.z.number(),
                value: zod_1.z.number(),
                warningThreshold: zod_1.z.number(),
            }),
            workflowsHavingEvaluations: zod_1.z.object({
                limit: zod_1.z.number(),
                value: zod_1.z.number(),
            }),
        }),
        license: zod_1.z.object({
            planId: zod_1.z.string(),
            planName: zod_1.z.string(),
        }),
        managementToken: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=usage.schema.js.map