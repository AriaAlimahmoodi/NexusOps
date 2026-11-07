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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseService = exports.LicenseErrors = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const errors_1 = require("@n8n/errors");
const license_eula_required_error_1 = require("../errors/response-errors/license-eula-required.error");
const license_1 = require("../license");
const REQUEST_TIMEOUT_MS = 30 * constants_1.Time.seconds.toMilliseconds;
exports.LicenseErrors = {
    SCHEMA_VALIDATION: 'Activation key is in the wrong format',
    RESERVATION_EXHAUSTED: 'Activation key has been used too many times',
    RESERVATION_EXPIRED: 'Activation key has expired',
    NOT_FOUND: 'Activation key not found',
    RESERVATION_CONFLICT: 'Activation key not found',
    RESERVATION_DUPLICATE: 'Activation key has already been used on this instance',
};
let LicenseService = class LicenseService {
    constructor(logger, license, licenseState, workflowRepository, urlService, eventService, outboundHttp) {
        this.logger = logger;
        this.license = license;
        this.licenseState = licenseState;
        this.workflowRepository = workflowRepository;
        this.urlService = urlService;
        this.eventService = eventService;
        this.http = outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
            timeout: REQUEST_TIMEOUT_MS,
        });
    }
    async getLicenseData() {
        const triggerCount = await this.workflowRepository.getActiveTriggerCount();
        const workflowsWithEvaluationsCount = await this.workflowRepository.getWorkflowsWithEvaluationCount();
        const mainPlan = this.license.getMainPlan();
        return {
            usage: {
                activeWorkflowTriggers: {
                    value: triggerCount,
                    limit: this.license.getTriggerLimit(),
                    warningThreshold: 0.8,
                },
                workflowsHavingEvaluations: {
                    value: workflowsWithEvaluationsCount,
                    limit: this.licenseState.getMaxWorkflowsWithEvaluations(),
                },
            },
            license: {
                planId: mainPlan?.productId ?? '',
                planName: this.license.getPlanName(),
            },
        };
    }
    async requestEnterpriseTrial(user) {
        await this.http.request({
            url: 'https://enterprise.n8n.io/enterprise-trial',
            method: 'POST',
            body: {
                licenseType: 'enterprise',
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                instanceUrl: this.urlService.getWebhookBaseUrl(),
            },
            json: true,
        });
    }
    async registerCommunityEdition({ userId, email, instanceId, instanceUrl, licenseType, }) {
        try {
            const { licenseKey, ...rest } = await this.http.request({
                url: 'https://enterprise.n8n.io/community-registered',
                method: 'POST',
                body: {
                    email,
                    instanceId,
                    instanceUrl,
                    licenseType,
                },
                json: true,
            });
            this.eventService.emit('license-community-plus-registered', { userId, email, licenseKey });
            return rest;
        }
        catch (e) {
            if ((0, backend_network_1.isHttpRequestError)(e)) {
                const data = e.response?.data;
                const errorMsg = data?.message ?? e.message;
                throw new errors_1.BadRequestError('Failed to register community edition: ' + errorMsg);
            }
            else {
                this.logger.error('Failed to register community edition', { error: (0, ensure_error_1.ensureError)(e) });
                throw new errors_1.BadRequestError('Failed to register community edition');
            }
        }
    }
    getManagementJwt() {
        return this.license.getManagementJwt();
    }
    async activateLicense(activationKey, eulaUri, userEmail) {
        try {
            if (eulaUri && userEmail) {
                await this.license.activate(activationKey, eulaUri, userEmail);
            }
            else if (!eulaUri && !userEmail) {
                await this.license.activate(activationKey);
            }
            else {
                throw new errors_1.BadRequestError('When providing eulaUri, userEmail is required');
            }
        }
        catch (e) {
            if (this.isEulaRequiredError(e)) {
                throw new license_eula_required_error_1.LicenseEulaRequiredError('License activation requires EULA acceptance', {
                    eulaUrl: e.info.eula.uri,
                });
            }
            const message = this.mapErrorMessage((0, ensure_error_1.ensureError)(e), 'activate');
            throw new errors_1.BadRequestError(message);
        }
    }
    isEulaRequiredError(error) {
        return (error instanceof Error &&
            'errorId' in error &&
            error.errorId === 'EULA_REQUIRED' &&
            'info' in error &&
            typeof error.info === 'object' &&
            error.info !== null &&
            'eula' in error.info &&
            typeof error.info.eula === 'object' &&
            error.info.eula !== null &&
            'uri' in error.info.eula &&
            typeof error.info.eula.uri === 'string');
    }
    async renewLicense() {
        if (this.license.getPlanName() === 'Community')
            return;
        try {
            await this.license.renew();
        }
        catch (e) {
            const message = this.mapErrorMessage((0, ensure_error_1.ensureError)(e), 'renew');
            this.eventService.emit('license-renewal-attempted', { success: false });
            throw new errors_1.BadRequestError(message);
        }
        this.eventService.emit('license-renewal-attempted', { success: true });
    }
    mapErrorMessage(error, action) {
        let message;
        if (this.isLicenseError(error) && error.errorId in exports.LicenseErrors) {
            message = exports.LicenseErrors[error.errorId];
        }
        if (!message) {
            message = `Failed to ${action} license: ${error.message}`;
            this.logger.error(message, { stack: error.stack ?? 'n/a' });
        }
        return message;
    }
    isLicenseError(error) {
        return 'errorId' in error && typeof error.errorId === 'string';
    }
};
exports.LicenseService = LicenseService;
exports.LicenseService = LicenseService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, license_1.License, backend_common_1.LicenseState, db_1.WorkflowRepository, backend_services_1.UrlService, backend_services_1.EventService, backend_network_1.OutboundHttp])
], LicenseService);
//# sourceMappingURL=license.service.js.map