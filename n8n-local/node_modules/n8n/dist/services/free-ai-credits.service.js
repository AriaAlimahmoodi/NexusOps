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
exports.FreeAiCreditsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const credentials_service_1 = require("../credentials/credentials.service");
const ai_service_1 = require("../services/ai.service");
const user_service_1 = require("../services/user.service");
let FreeAiCreditsService = class FreeAiCreditsService {
    constructor(licenseState, globalConfig, aiService, credentialsService, userService) {
        this.licenseState = licenseState;
        this.globalConfig = globalConfig;
        this.aiService = aiService;
        this.credentialsService = credentialsService;
        this.userService = userService;
    }
    isEligible(user) {
        return (this.licenseState.isAiCreditsLicensed() &&
            !!this.globalConfig.aiAssistant.baseUrl &&
            !(this.globalConfig.aiGateway.enabled && this.licenseState.isAiGatewayLicensed()) &&
            !user.settings?.userClaimedAiCredits);
    }
    async claim(user, projectId) {
        const aiCredits = await this.aiService.createFreeAiCredits(user);
        const credential = await this.credentialsService.createManagedCredential({
            name: constants_1.FREE_AI_CREDITS_CREDENTIAL_NAME,
            type: n8n_workflow_1.OPEN_AI_API_CREDENTIAL_TYPE,
            data: {
                apiKey: aiCredits.apiKey,
                url: aiCredits.url,
            },
            projectId,
        }, user);
        await this.userService.updateSettings(user.id, { userClaimedAiCredits: true });
        return credential;
    }
};
exports.FreeAiCreditsService = FreeAiCreditsService;
exports.FreeAiCreditsService = FreeAiCreditsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.LicenseState, config_1.GlobalConfig, ai_service_1.AiService, credentials_service_1.CredentialsService, user_service_1.UserService])
], FreeAiCreditsService);
//# sourceMappingURL=free-ai-credits.service.js.map