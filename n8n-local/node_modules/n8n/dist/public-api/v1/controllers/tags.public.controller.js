"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const tag_service_1 = require("../../../services/tag.service");
const tags = ['Tags'];
const toTagPublicDto = (tag) => ({
    id: tag.id,
    name: tag.name,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
});
let TagsPublicController = class TagsPublicController {
    constructor(tagService) {
        this.tagService = tagService;
    }
    async getTags(_req, _res, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const { data, count } = await this.tagService.getPaginated({ offset, limit });
        return {
            data: data.map(toTagPublicDto),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({
                offset,
                limit,
                numberOfTotalRecords: count,
            }),
        };
    }
    async createTag(_req, _res, body) {
        const newTag = this.tagService.toEntity({ name: body.name });
        try {
            return toTagPublicDto(await this.tagService.save(newTag, 'create'));
        }
        catch {
            throw new errors_1.ConflictError('Tag already exists');
        }
    }
    async getTag(_req, _res, tagId) {
        let tag;
        try {
            tag = await this.tagService.getById(tagId);
        }
        catch {
            throw new errors_1.NotFoundError('Not Found');
        }
        return toTagPublicDto(tag);
    }
    async updateTag(_req, _res, tagId, body) {
        try {
            await this.tagService.getById(tagId);
        }
        catch {
            throw new errors_1.NotFoundError('Not Found');
        }
        const tag = this.tagService.toEntity({ id: tagId, name: body.name.trim() });
        let updatedTag;
        try {
            updatedTag = await this.tagService.save(tag, 'update');
        }
        catch {
            throw new errors_1.ConflictError('Tag already exists');
        }
        return {
            id: updatedTag.id,
            name: updatedTag.name,
            ...(updatedTag.createdAt ? { createdAt: updatedTag.createdAt.toISOString() } : {}),
            ...(updatedTag.updatedAt ? { updatedAt: updatedTag.updatedAt.toISOString() } : {}),
        };
    }
    async deleteTag(_req, _res, tagId) {
        let tag;
        try {
            tag = await this.tagService.getById(tagId);
        }
        catch {
            throw new errors_1.NotFoundError('Not Found');
        }
        await this.tagService.delete(tagId);
        return toTagPublicDto(tag);
    }
};
exports.TagsPublicController = TagsPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('tag:list'),
    (0, decorators_1.ApiSummary)('Retrieve all tags'),
    (0, decorators_1.ApiDescription)('Retrieve all tags from your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.TagListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListTagsQueryDto]),
    __metadata("design:returntype", Promise)
], TagsPublicController.prototype, "getTags", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('tag:create'),
    (0, decorators_1.ApiSummary)('Create a tag'),
    (0, decorators_1.ApiDescription)('Create a tag in your instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(201, api_types_1.TagPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateTagPublicDto]),
    __metadata("design:returntype", Promise)
], TagsPublicController.prototype, "createTag", null);
__decorate([
    (0, decorators_1.Get)('/:tagId'),
    (0, decorators_1.ApiKeyScope)('tag:read'),
    (0, decorators_1.ApiSummary)('Retrieves a tag'),
    (0, decorators_1.ApiDescription)('Retrieves a tag.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.TagPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('tagId', api_types_1.tagIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TagsPublicController.prototype, "getTag", null);
__decorate([
    (0, decorators_1.Put)('/:tagId'),
    (0, decorators_1.ApiKeyScope)('tag:update'),
    (0, decorators_1.ApiSummary)('Update a tag'),
    (0, decorators_1.ApiDescription)('Update a tag.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.UpdatedTagPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('tagId', api_types_1.tagIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateTagPublicDto]),
    __metadata("design:returntype", Promise)
], TagsPublicController.prototype, "updateTag", null);
__decorate([
    (0, decorators_1.Delete)('/:tagId'),
    (0, decorators_1.ApiKeyScope)('tag:delete'),
    (0, decorators_1.ApiSummary)('Delete a tag'),
    (0, decorators_1.ApiDescription)('Deletes a tag.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.TagPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('tagId', api_types_1.tagIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TagsPublicController.prototype, "deleteTag", null);
exports.TagsPublicController = TagsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/tags'),
    __metadata("design:paramtypes", [tag_service_1.TagService])
], TagsPublicController);
//# sourceMappingURL=tags.public.controller.js.map