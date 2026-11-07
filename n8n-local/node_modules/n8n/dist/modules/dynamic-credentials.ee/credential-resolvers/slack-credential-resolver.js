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
exports.SlackCredentialResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const slack_signature_identifier_1 = require("./identifiers/slack-signature-identifier");
const dynamic_credential_entry_storage_1 = require("./storage/dynamic-credential-entry-storage");
const SlackCredentialResolverOptionsSchema = slack_signature_identifier_1.SlackSignatureOptionsSchema;
let SlackCredentialResolver = class SlackCredentialResolver {
    constructor(logger, slackSignatureIdentifier, storage, cipher) {
        this.logger = logger;
        this.slackSignatureIdentifier = slackSignatureIdentifier;
        this.storage = storage;
        this.cipher = cipher;
        this.metadata = {
            name: 'credential-resolver.slack-1.0',
            description: 'Slack-based credential resolver using request signatures',
            displayName: 'Slack Resolver',
            options: [
                {
                    displayName: 'Slack Signing Secret',
                    name: 'signingSecret',
                    type: 'string',
                    typeOptions: { password: true },
                    required: true,
                    default: '',
                    description: 'The signing secret from your Slack App (Basic Information → App Credentials → Signing Secret)',
                },
                {
                    displayName: 'Subject Claim',
                    name: 'subjectClaim',
                    type: 'options',
                    options: [
                        {
                            name: 'User ID',
                            value: 'user_id',
                            description: 'Use Slack user ID as the unique credential key',
                        },
                        {
                            name: 'Team ID + User ID',
                            value: 'team_user',
                            description: 'Use team_id:user_id as the key (recommended for Enterprise Grid / multi-workspace)',
                        },
                    ],
                    default: 'user_id',
                    description: 'How to identify unique credential holders',
                },
            ],
        };
    }
    async getSecret(credentialId, context, handle) {
        const parsedOptions = this.parseOptions(handle.configuration);
        const key = await this.slackSignatureIdentifier.resolve(context, parsedOptions);
        const data = await this.storage.getCredentialData(credentialId, key, handle.resolverId, parsedOptions);
        if (!data) {
            throw new decorators_1.CredentialResolverDataNotFoundError();
        }
        try {
            const plaintext = await this.cipher.decryptV2(data);
            return (0, n8n_workflow_1.jsonParse)(plaintext);
        }
        catch (error) {
            this.logger.error('Failed to decrypt or parse credential data');
            throw new decorators_1.CredentialResolverDataNotFoundError();
        }
    }
    async setSecret(credentialId, context, data, handle) {
        const parsedOptions = this.parseOptions(handle.configuration);
        const key = this.slackSignatureIdentifier.resolveKey(context, parsedOptions);
        const encryptedData = await this.cipher.encryptV2(data);
        await this.storage.setCredentialData(credentialId, key, handle.resolverId, encryptedData, parsedOptions);
    }
    async deleteSecret(credentialId, context, handle) {
        const parsedOptions = this.parseOptions(handle.configuration);
        const key = await this.slackSignatureIdentifier.resolve(context, parsedOptions);
        await this.storage.deleteCredentialData(credentialId, key, handle.resolverId, parsedOptions);
    }
    async deleteAllSecrets(handle) {
        await this.storage.deleteAllCredentialData(handle);
    }
    async validateOptions(options) {
        this.parseOptions(options);
    }
    async validateIdentity(context, handle) {
        const parsedOptions = this.parseOptions(handle.configuration);
        await this.slackSignatureIdentifier.resolve(context, parsedOptions);
    }
    parseOptions(options) {
        const result = SlackCredentialResolverOptionsSchema.safeParse(options);
        if (!result.success) {
            this.logger.error('Invalid options provided to SlackCredentialResolver', {
                error: result.error,
            });
            throw new decorators_1.CredentialResolverValidationError(`Invalid options for SlackCredentialResolver: ${result.error.message}`);
        }
        return result.data;
    }
};
exports.SlackCredentialResolver = SlackCredentialResolver;
exports.SlackCredentialResolver = SlackCredentialResolver = __decorate([
    (0, decorators_1.CredentialResolver)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, slack_signature_identifier_1.SlackSignatureIdentifier, dynamic_credential_entry_storage_1.DynamicCredentialEntryStorage, n8n_core_1.Cipher])
], SlackCredentialResolver);
//# sourceMappingURL=slack-credential-resolver.js.map