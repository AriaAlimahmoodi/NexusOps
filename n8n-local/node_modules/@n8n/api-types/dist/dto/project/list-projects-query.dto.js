"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListProjectsQueryDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
const pagination_dto_1 = require("../pagination/pagination.dto");
const searchValidator = zod_1.z.string().trim().optional();
const skipValidator = zod_1.z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && Number.isInteger(val)), {
    message: 'Param `skip` must be a valid integer',
})
    .refine((val) => val === undefined || val >= 0, {
    message: 'Param `skip` must be a non-negative integer',
});
const typeValidator = zod_1.z.enum(['personal', 'team']).optional();
const activatedValidator = zod_1.z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true'));
const takeValidator = zod_1.z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && Number.isInteger(val)), {
    message: 'Param `take` must be a valid integer',
})
    .refine((val) => val === undefined || val >= 0, {
    message: 'Param `take` must be a non-negative integer',
})
    .transform((val) => (val !== undefined ? Math.min(val, pagination_dto_1.MAX_ITEMS_PER_PAGE) : undefined));
class ListProjectsQueryDto extends zod_class_1.Z.class({
    skip: skipValidator,
    take: takeValidator,
    search: searchValidator,
    type: typeValidator,
    activated: activatedValidator,
}) {
}
exports.ListProjectsQueryDto = ListProjectsQueryDto;
//# sourceMappingURL=list-projects-query.dto.js.map