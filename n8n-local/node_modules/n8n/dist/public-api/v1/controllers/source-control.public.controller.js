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
exports.SourceControlPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const source_control_helper_ee_1 = require("../../../modules/source-control.ee/source-control-helper.ee");
const source_control_preferences_service_ee_1 = require("../../../modules/source-control.ee/source-control-preferences.service.ee");
const source_control_scoped_service_1 = require("../../../modules/source-control.ee/source-control-scoped.service");
const source_control_service_ee_1 = require("../../../modules/source-control.ee/source-control.service.ee");
const tags = ['SourceControl'];
let SourceControlPublicController = class SourceControlPublicController {
    constructor(sourceControlService, sourceControlPreferencesService, sourceControlScopedService, eventService) {
        this.sourceControlService = sourceControlService;
        this.sourceControlPreferencesService = sourceControlPreferencesService;
        this.sourceControlScopedService = sourceControlScopedService;
        this.eventService = eventService;
    }
    async getSourceControlStatus(req, _res, query) {
        await this.sourceControlScopedService.ensureIsAllowedToGetStatus(req);
        if (!this.sourceControlPreferencesService.isSourceControlConnected()) {
            throw new errors_1.BadRequestError('Source Control is not connected to a repository');
        }
        const result = await this.sourceControlService.getStatus(req.user, {
            direction: query.direction,
            preferLocalVersion: query.direction === 'push',
            verbose: false,
            origin: 'publicApi',
        });
        const files = Array.isArray(result) ? result : result.sourceControlledFiles;
        return { data: files };
    }
    async pushSourceControl(req, _res, body) {
        await this.sourceControlScopedService.ensureIsAllowedToPush(req);
        if (!this.sourceControlPreferencesService.isSourceControlConnected()) {
            throw new errors_1.BadRequestError('Source Control is not connected to a repository');
        }
        const result = await this.sourceControlService.pushWorkfolder(req.user, {
            commitMessage: body.commitMessage,
            fileNames: body.fileNames,
            force: body.force,
        }, 'publicApi');
        if (result.statusCode === 409) {
            const conflicts = result.statusResult.filter((file) => file.conflict);
            throw new errors_1.ConflictError('Push blocked by conflicting files. Pass `force: true` to push anyway.', undefined, { conflicts });
        }
        return { data: result.statusResult };
    }
    async pullSourceControl(req, res, body) {
        if (!this.sourceControlPreferencesService.isSourceControlConnected()) {
            res
                .status(400)
                .json({ status: 'Error', message: 'Source Control is not connected to a repository' });
            return;
        }
        try {
            const result = await this.sourceControlService.pullWorkfolder(req.user, body);
            if (result.statusCode === 200) {
                this.eventService.emit('source-control-user-pulled-api', {
                    ...(0, source_control_helper_ee_1.getTrackingInformationFromPullResult)(req.user.id, result.statusResult),
                    forced: body.force ?? false,
                });
                return result.statusResult;
            }
            res.status(409).json(result.statusResult);
            return;
        }
        catch (error) {
            res.status(400).send(error.message);
            return;
        }
    }
};
exports.SourceControlPublicController = SourceControlPublicController;
__decorate([
    (0, decorators_1.Get)('/status'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.SOURCE_CONTROL),
    (0, decorators_1.ApiKeyScope)('sourceControl:read'),
    (0, decorators_1.ApiSummary)('Preview pending source control changes'),
    (0, decorators_1.ApiDescription)('Previews the pending changes between the instance and the connected Git branch in either the `push` or `pull` direction.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.SourceControlStatusPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SourceControlStatusQueryPublicDto]),
    __metadata("design:returntype", Promise)
], SourceControlPublicController.prototype, "getSourceControlStatus", null);
__decorate([
    (0, decorators_1.Post)('/push'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.SOURCE_CONTROL),
    (0, decorators_1.ApiKeyScope)('sourceControl:push'),
    (0, decorators_1.ApiSummary)('Push local source control changes'),
    (0, decorators_1.ApiDescription)('Commits and pushes the selected files to the connected Git branch. Each entry in ' +
        '`fileNames` is resolved against a fresh preview of the pending changes.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.SourceControlPushResponsePublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(403),
    (0, decorators_1.ApiErrorResponse)(409, {
        dto: api_types_1.SourceControlPushConflictErrorPublicDto,
        description: 'The push includes files with unresolved conflicts. Retry with `force: true` to push anyway.',
    }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SourceControlPushRequestPublicDto]),
    __metadata("design:returntype", Promise)
], SourceControlPublicController.prototype, "pushSourceControl", null);
__decorate([
    (0, decorators_1.Post)('/pull'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.SOURCE_CONTROL),
    (0, decorators_1.ApiKeyScope)('sourceControl:pull'),
    (0, decorators_1.ApiSummary)('Pull changes from the remote repository'),
    (0, decorators_1.ApiDescription)('Fetches changes from the connected Git branch into the instance.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.SourceControlPullResponsePublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(409, {
        dto: api_types_1.SourceControlPullResponsePublicDto,
        description: 'Conflict due to uncommitted local changes or merge conflicts. The response body lists ' +
            'every file in the pull diff; files causing the conflict have `conflict: true` or ' +
            '`status: modified`. Retry with `force: true` to discard local changes.',
    }),
    __param(2, (0, decorators_1.Body)({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PullWorkFolderRequestDto]),
    __metadata("design:returntype", Promise)
], SourceControlPublicController.prototype, "pullSourceControl", null);
exports.SourceControlPublicController = SourceControlPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/source-control'),
    __metadata("design:paramtypes", [source_control_service_ee_1.SourceControlService, source_control_preferences_service_ee_1.SourceControlPreferencesService, source_control_scoped_service_1.SourceControlScopedService, backend_services_1.EventService])
], SourceControlPublicController);
//# sourceMappingURL=source-control.public.controller.js.map