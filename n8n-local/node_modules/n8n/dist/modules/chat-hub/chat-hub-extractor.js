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
exports.ChatHubExtractor = exports.CHATHUB_EXTRACTOR_NAME = void 0;
exports.extractAuthenticationMetadata = extractAuthenticationMetadata;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const auth_service_1 = require("../../auth/auth.service");
const backend_services_1 = require("@n8n/backend-services");
const EncryptedMetadataSchema = zod_1.z.object({
    encryptedMetadata: zod_1.z.string(),
});
const ChatHubAuthenticationMetadataSchema = zod_1.z.object({
    authToken: zod_1.z.string(),
    browserId: zod_1.z.string().optional(),
    method: zod_1.z.string(),
    endpoint: zod_1.z.string(),
});
exports.CHATHUB_EXTRACTOR_NAME = 'ChatHubExtractor';
function extractAuthenticationMetadata(req) {
    const authService = di_1.Container.get(auth_service_1.AuthService);
    const authToken = authService.getCookieToken(req);
    if (!authToken) {
        throw new Error('No authentication token found');
    }
    return {
        authToken,
        browserId: authService.getBrowserId(req),
        method: authService.getMethod(req),
        endpoint: authService.getEndpoint(req),
    };
}
let ChatHubExtractor = class ChatHubExtractor {
    constructor(logger, cipher, executingUserIdentifierProxy) {
        this.logger = logger;
        this.cipher = cipher;
        this.executingUserIdentifierProxy = executingUserIdentifierProxy;
        this.hookDescription = {
            name: exports.CHATHUB_EXTRACTOR_NAME,
            displayName: 'Chat Hub Extractor',
            options: [],
        };
        this.logger = this.logger.scoped('chat-hub');
    }
    isApplicableToTriggerNode(_nodeType) {
        return false;
    }
    async execute(options) {
        if (!options.triggerItems || options.triggerItems.length === 0) {
            this.logger.debug('No trigger items found, skipping ChatHubExtractor hook.');
            throw new Error('No trigger items found, skipping ChatHubExtractor hook.');
        }
        const [triggerItem] = options.triggerItems;
        const encryptedMetadataResult = EncryptedMetadataSchema.safeParse(triggerItem);
        delete triggerItem.encryptedMetadata;
        if (encryptedMetadataResult.success) {
            try {
                const decrypted = await this.cipher.decryptV2(encryptedMetadataResult.data.encryptedMetadata);
                const parsed = (0, n8n_workflow_1.jsonParse)(decrypted);
                const chatHubInformation = ChatHubAuthenticationMetadataSchema.safeParse(parsed);
                if (chatHubInformation.success) {
                    const credentials = {
                        version: 1,
                        identity: chatHubInformation.data.authToken,
                        metadata: {
                            source: 'chat-hub-injected',
                            browserId: chatHubInformation.data.browserId,
                            method: chatHubInformation.data.method,
                            endpoint: chatHubInformation.data.endpoint,
                        },
                    };
                    const contextUpdate = { credentials };
                    if (options.context?.usesDynamicCredentials) {
                        const executedByUserId = await this.executingUserIdentifierProxy.identify(credentials);
                        if (executedByUserId)
                            contextUpdate.executedByUserId = executedByUserId;
                    }
                    return {
                        triggerItems: options.triggerItems,
                        contextUpdate,
                    };
                }
                else {
                    this.logger.warn('Invalid format for encryptedMetadata in chathub extractor', {
                        errors: chatHubInformation.error.errors,
                    });
                }
            }
            catch (error) {
                this.logger.error('Failed to decrypt/parse encrypted chat metadata', {
                    error: (0, ensure_error_1.ensureError)(error),
                });
            }
        }
        else {
            this.logger.warn('No encryptedMetadata found in trigger item for ChatHubExtractor.');
        }
        throw new Error('No valid Chat Hub authentication metadata could be extracted.');
    }
};
exports.ChatHubExtractor = ChatHubExtractor;
exports.ChatHubExtractor = ChatHubExtractor = __decorate([
    (0, decorators_1.ContextEstablishmentHook)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.Cipher, backend_services_1.ExecutingUserIdentifierProxy])
], ChatHubExtractor);
//# sourceMappingURL=chat-hub-extractor.js.map