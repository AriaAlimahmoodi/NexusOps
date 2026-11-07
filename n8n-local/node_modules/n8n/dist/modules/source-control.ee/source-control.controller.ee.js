"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceControlController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const permissions_1 = require("@n8n/permissions");
const express = __importStar(require("express"));
const constants_1 = require("./constants");
const source_control_enabled_middleware_ee_1 = require("./middleware/source-control-enabled-middleware.ee");
const source_control_context_factory_1 = require("./source-control-context.factory");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_preferences_service_ee_1 = require("./source-control-preferences.service.ee");
const source_control_scoped_service_1 = require("./source-control-scoped.service");
const source_control_service_ee_1 = require("./source-control.service.ee");
const source_control_get_status_1 = require("./types/source-control-get-status");
const errors_1 = require("@n8n/errors");
let SourceControlController = class SourceControlController {
    constructor(sourceControlService, sourceControlPreferencesService, sourceControlScopedService, sourceControlContextFactory, eventService) {
        this.sourceControlService = sourceControlService;
        this.sourceControlPreferencesService = sourceControlPreferencesService;
        this.sourceControlScopedService = sourceControlScopedService;
        this.sourceControlContextFactory = sourceControlContextFactory;
        this.eventService = eventService;
    }
    async getPreferences(req) {
        const preferences = this.sourceControlPreferencesService.getPreferences();
        if ((0, permissions_1.hasGlobalScope)(req.user, 'sourceControl:manage')) {
            const publicKey = await this.sourceControlPreferencesService.getPublicKey();
            return { ...preferences, publicKey };
        }
        const publicSubset = {
            branchReadOnly: preferences.branchReadOnly,
        };
        const ctx = await this.sourceControlContextFactory.createContext(req.user);
        if (ctx.authorizedProjects.length > 0) {
            return {
                ...publicSubset,
                connected: preferences.connected,
                branchName: preferences.branchName,
                branchColor: preferences.branchColor,
            };
        }
        return publicSubset;
    }
    async setPreferences(req) {
        if (req.body.branchReadOnly === undefined &&
            this.sourceControlPreferencesService.isSourceControlConnected()) {
            throw new errors_1.BadRequestError('Cannot change preferences while connected to a source control provider. Please disconnect first.');
        }
        try {
            const sanitizedPreferences = {
                ...req.body,
                initRepo: req.body.initRepo ?? true,
                connected: undefined,
                publicKey: undefined,
            };
            await this.sourceControlPreferencesService.validateSourceControlPreferences(sanitizedPreferences);
            const updatedPreferences = await this.sourceControlPreferencesService.setPreferences(sanitizedPreferences);
            if (sanitizedPreferences.initRepo === true) {
                try {
                    await this.sourceControlService.initializeRepository({
                        ...updatedPreferences,
                        branchName: updatedPreferences.branchName === ''
                            ? constants_1.SOURCE_CONTROL_DEFAULT_BRANCH
                            : updatedPreferences.branchName,
                        initRepo: true,
                    }, req.user);
                    if (this.sourceControlPreferencesService.getPreferences().branchName !== '') {
                        await this.sourceControlPreferencesService.setPreferences({
                            connected: true,
                        });
                    }
                }
                catch (error) {
                    await this.sourceControlService.disconnect({ keepKeyPair: true });
                    throw error;
                }
            }
            await this.sourceControlService.start();
            const resultingPreferences = this.sourceControlPreferencesService.getPreferences();
            this.eventService.emit('source-control-settings-updated', {
                branchName: resultingPreferences.branchName,
                connected: resultingPreferences.connected,
                readOnlyInstance: resultingPreferences.branchReadOnly,
                repoType: (0, source_control_helper_ee_1.getRepoType)(resultingPreferences.repositoryUrl),
                connectionType: resultingPreferences.connectionType,
            });
            return resultingPreferences;
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async updatePreferences(req) {
        try {
            const sanitizedPreferences = {
                ...req.body,
                initRepo: false,
                connected: undefined,
                publicKey: undefined,
                repositoryUrl: undefined,
            };
            const currentPreferences = this.sourceControlPreferencesService.getPreferences();
            await this.sourceControlPreferencesService.validateSourceControlPreferences(sanitizedPreferences);
            if (sanitizedPreferences.branchName &&
                sanitizedPreferences.branchName !== currentPreferences.branchName) {
                await this.sourceControlService.setBranch(sanitizedPreferences.branchName);
            }
            if (sanitizedPreferences.branchColor ?? sanitizedPreferences.branchReadOnly !== undefined) {
                await this.sourceControlPreferencesService.setPreferences({
                    branchColor: sanitizedPreferences.branchColor,
                    branchReadOnly: sanitizedPreferences.branchReadOnly,
                }, true);
            }
            await this.sourceControlService.start();
            const resultingPreferences = this.sourceControlPreferencesService.getPreferences();
            this.eventService.emit('source-control-settings-updated', {
                branchName: resultingPreferences.branchName,
                connected: resultingPreferences.connected,
                readOnlyInstance: resultingPreferences.branchReadOnly,
                repoType: (0, source_control_helper_ee_1.getRepoType)(resultingPreferences.repositoryUrl),
                connectionType: resultingPreferences.connectionType,
            });
            return resultingPreferences;
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async disconnect(req) {
        try {
            return await this.sourceControlService.disconnect(req.body);
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async getBranches() {
        try {
            return await this.sourceControlService.getBranches();
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async pushWorkfolder(req, res, payload) {
        await this.sourceControlScopedService.ensureIsAllowedToPush(req);
        try {
            const result = await this.sourceControlService.pushWorkfolder(req.user, payload);
            res.statusCode = result.statusCode;
            const commitInfo = result.pushResult?.update?.hash?.to
                ? {
                    hash: result.pushResult.update.hash.to,
                    message: payload.commitMessage ?? 'Updated Workfolder',
                    branch: result.pushResult.update.head?.local ?? '',
                }
                : null;
            return {
                files: result.statusResult,
                commit: commitInfo,
            };
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async pullWorkfolder(req, res, payload) {
        try {
            const result = await this.sourceControlService.pullWorkfolder(req.user, payload);
            res.statusCode = result.statusCode;
            return result.statusResult;
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async resetWorkfolder() {
        try {
            return await this.sourceControlService.resetWorkfolder();
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async getStatus(req) {
        await this.sourceControlScopedService.ensureIsAllowedToGetStatus(req);
        try {
            const result = await this.sourceControlService.getStatus(req.user, new source_control_get_status_1.SourceControlGetStatus(req.query));
            return result;
        }
        catch (error) {
            if (error instanceof errors_1.ForbiddenError) {
                throw error;
            }
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async status(req) {
        await this.sourceControlScopedService.ensureIsAllowedToGetStatus(req);
        try {
            return await this.sourceControlService.getStatus(req.user, new source_control_get_status_1.SourceControlGetStatus(req.query));
        }
        catch (error) {
            if (error instanceof errors_1.ForbiddenError) {
                throw error;
            }
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async generateKeyPair(req) {
        try {
            const keyPairType = req.body.keyGeneratorType;
            const result = await this.sourceControlPreferencesService.generateAndSaveKeyPair(keyPairType);
            const publicKey = await this.sourceControlPreferencesService.getPublicKey();
            return { ...result, publicKey };
        }
        catch (error) {
            throw new errors_1.BadRequestError(error.message);
        }
    }
    async getFileContent(req) {
        try {
            const { type, id } = req.params;
            const content = await this.sourceControlService.getRemoteFileEntity({
                user: req.user,
                type,
                id,
            });
            return { content, type };
        }
        catch (error) {
            if (error instanceof errors_1.ForbiddenError) {
                throw error;
            }
            throw new errors_1.BadRequestError(error.message);
        }
    }
};
exports.SourceControlController = SourceControlController;
__decorate([
    (0, decorators_1.Get)('/preferences'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "getPreferences", null);
__decorate([
    (0, decorators_1.Post)('/preferences'),
    (0, decorators_1.GlobalScope)('sourceControl:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "setPreferences", null);
__decorate([
    (0, decorators_1.Patch)('/preferences'),
    (0, decorators_1.GlobalScope)('sourceControl:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "updatePreferences", null);
__decorate([
    (0, decorators_1.Post)('/disconnect'),
    (0, decorators_1.GlobalScope)('sourceControl:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "disconnect", null);
__decorate([
    (0, decorators_1.Get)('/get-branches'),
    (0, decorators_1.GlobalScope)('sourceControl:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "getBranches", null);
__decorate([
    (0, decorators_1.Post)('/push-workfolder', { middlewares: [source_control_enabled_middleware_ee_1.sourceControlEnabledMiddleware] }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PushWorkFolderRequestDto]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "pushWorkfolder", null);
__decorate([
    (0, decorators_1.Post)('/pull-workfolder', { middlewares: [source_control_enabled_middleware_ee_1.sourceControlEnabledMiddleware] }),
    (0, decorators_1.GlobalScope)('sourceControl:pull'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PullWorkFolderRequestDto]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "pullWorkfolder", null);
__decorate([
    (0, decorators_1.Get)('/reset-workfolder', { middlewares: [source_control_enabled_middleware_ee_1.sourceControlEnabledMiddleware] }),
    (0, decorators_1.GlobalScope)('sourceControl:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "resetWorkfolder", null);
__decorate([
    (0, decorators_1.Get)('/get-status', { middlewares: [source_control_enabled_middleware_ee_1.sourceControlEnabledMiddleware] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "getStatus", null);
__decorate([
    (0, decorators_1.Get)('/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "status", null);
__decorate([
    (0, decorators_1.Post)('/generate-key-pair'),
    (0, decorators_1.GlobalScope)('sourceControl:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "generateKeyPair", null);
__decorate([
    (0, decorators_1.Get)('/remote-content/:type/:id', { middlewares: [source_control_enabled_middleware_ee_1.sourceControlEnabledMiddleware] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourceControlController.prototype, "getFileContent", null);
exports.SourceControlController = SourceControlController = __decorate([
    (0, decorators_1.RestController)('/source-control'),
    __metadata("design:paramtypes", [source_control_service_ee_1.SourceControlService, source_control_preferences_service_ee_1.SourceControlPreferencesService, source_control_scoped_service_1.SourceControlScopedService, source_control_context_factory_1.SourceControlContextFactory, backend_services_1.EventService])
], SourceControlController);
//# sourceMappingURL=source-control.controller.ee.js.map