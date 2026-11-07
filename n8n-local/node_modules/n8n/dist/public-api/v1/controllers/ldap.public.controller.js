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
exports.LdapPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const ldap_errors_1 = require("../../../modules/ldap.ee/ldap.errors");
const ldap_service_ee_1 = require("../../../modules/ldap.ee/ldap.service.ee");
const redact_ldap_config_1 = require("../../../modules/ldap.ee/redact-ldap-config");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
const tags = ['SettingsLdap'];
let LdapPublicController = class LdapPublicController {
    constructor(ldapService) {
        this.ldapService = ldapService;
    }
    async getLdapConfiguration() {
        const config = await this.ldapService.loadConfig();
        return (0, redact_ldap_config_1.redactLdapConfig)(config);
    }
    async updateLdapConfiguration(_req, _res, body) {
        await this.ldapService.updateConfig(body);
        const config = await this.ldapService.loadConfig();
        return (0, redact_ldap_config_1.redactLdapConfig)(config);
    }
    async getLdapSync(_req, _res, query) {
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const [rows, count] = await this.ldapService.getSynchronizations(offset, limit);
        return {
            data: rows.map(toLdapSyncHistoryPublic),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({ offset, limit, numberOfTotalRecords: count }),
        };
    }
    async runLdapSync(_req, _res, body) {
        const syncHistory = await this.runSync(body.type);
        return toLdapSyncHistoryPublic(syncHistory);
    }
    async runSync(type) {
        try {
            return await this.ldapService.runSync(type);
        }
        catch (error) {
            if (error instanceof errors_1.ResponseError) {
                throw error;
            }
            if (error instanceof ldap_errors_1.LdapRejectionError || error instanceof ldap_errors_1.LdapConnectionError) {
                throw new errors_1.BadRequestError(error.message);
            }
            throw error;
        }
    }
};
exports.LdapPublicController = LdapPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('ldap:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LDAP),
    (0, decorators_1.ApiSummary)('Retrieve the LDAP configuration'),
    (0, decorators_1.ApiDescription)('Retrieve the current LDAP configuration, including every field exposed in the UI. The binding admin password is redacted on read. Requires the `ldap:manage` scope and the LDAP feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LdapConfigurationPublicDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LdapPublicController.prototype, "getLdapConfiguration", null);
__decorate([
    (0, decorators_1.Put)('/'),
    (0, decorators_1.ApiKeyScope)('ldap:manage'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LDAP),
    (0, decorators_1.ApiSummary)('Set the LDAP configuration'),
    (0, decorators_1.ApiDescription)('Replace the LDAP configuration with the provided full object (partial updates are not supported). For bindingAdminPassword, submit the blanking placeholder from a prior GET to keep the stored password unchanged. Requires the `ldap:manage` scope and the LDAP feature to be licensed. Setting loginEnabled to false is destructive and it deletes all stored LDAP user identities and disables synchronization.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LdapConfigurationPublicDto),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateLdapConfigurationPublicDto]),
    __metadata("design:returntype", Promise)
], LdapPublicController.prototype, "updateLdapConfiguration", null);
__decorate([
    (0, decorators_1.Get)('/sync'),
    (0, decorators_1.ApiKeyScope)('ldap:sync'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LDAP),
    (0, decorators_1.ApiSummary)('Retrieve LDAP synchronization history'),
    (0, decorators_1.ApiDescription)('Retrieve the history of LDAP synchronizations, most recent first. Requires the `ldap:sync` scope and the LDAP feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LdapSyncHistoryListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListLdapSyncHistoryQueryDto]),
    __metadata("design:returntype", Promise)
], LdapPublicController.prototype, "getLdapSync", null);
__decorate([
    (0, decorators_1.Post)('/sync'),
    (0, decorators_1.ApiKeyScope)('ldap:sync'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LDAP),
    (0, decorators_1.ApiSummary)('Trigger an LDAP synchronization'),
    (0, decorators_1.ApiDescription)('Manually trigger an LDAP synchronization. The response returns the new sync history record. Requires the `ldap:sync` scope and the LDAP feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LdapSyncHistoryPublicDto),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.RunLdapSyncPublicDto]),
    __metadata("design:returntype", Promise)
], LdapPublicController.prototype, "runLdapSync", null);
exports.LdapPublicController = LdapPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/settings/ldap'),
    __metadata("design:paramtypes", [ldap_service_ee_1.LdapService])
], LdapPublicController);
function toLdapSyncHistoryPublic(row) {
    return {
        id: row.id,
        runMode: row.runMode,
        status: row.status,
        startedAt: row.startedAt.toISOString(),
        endedAt: row.endedAt.toISOString(),
        scanned: row.scanned,
        created: row.created,
        updated: row.updated,
        disabled: row.disabled,
        error: row.error,
    };
}
//# sourceMappingURL=ldap.public.controller.js.map