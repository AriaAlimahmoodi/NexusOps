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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthCredentialResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const oauth2_introspection_identifier_1 = require("./identifiers/oauth2-introspection-identifier");
const oauth2_userinfo_identifier_1 = require("./identifiers/oauth2-userinfo-identifier");
const dynamic_credential_entry_storage_1 = require("./storage/dynamic-credential-entry-storage");
const OAuthCredentialResolverOptionsSchema = zod_1.default.discriminatedUnion('validation', [
    oauth2_introspection_identifier_1.OAuth2IntrospectionOptionsSchema,
    oauth2_userinfo_identifier_1.OAuth2UserInfoOptionsSchema,
]);
let OAuthCredentialResolver = class OAuthCredentialResolver {
    constructor(logger, oAuth2TokenIntrospectionIdentifier, oAuth2UserInfoIdentifier, storage, cipher) {
        this.logger = logger;
        this.oAuth2TokenIntrospectionIdentifier = oAuth2TokenIntrospectionIdentifier;
        this.oAuth2UserInfoIdentifier = oAuth2UserInfoIdentifier;
        this.storage = storage;
        this.cipher = cipher;
        this.metadata = {
            name: 'credential-resolver.oauth2-1.0',
            description: 'OAuth2 based credential resolver',
            displayName: 'OAuth2 Resolver',
            options: [
                {
                    displayName: 'Metadata URL',
                    name: 'metadataUri',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'https://auth.example.com/.well-known/openid-configuration',
                    description: 'OAuth2 server metadata endpoint URL',
                },
                {
                    displayName: 'Validation Method',
                    name: 'validation',
                    type: 'options',
                    options: [
                        {
                            name: 'OAuth2 Token Introspection',
                            value: 'oauth2-introspection',
                            description: 'Validate token via OAuth2 Token Introspection Endpoint',
                        },
                        {
                            name: 'OAuth2 UserInfo Endpoint',
                            value: 'oauth2-userinfo',
                            description: 'Validate token via OAuth2 UserInfo Endpoint',
                        },
                    ],
                    default: 'oauth2-introspection',
                    description: 'Validation method to use for token validation',
                },
                {
                    displayName: 'Client ID',
                    name: 'clientId',
                    type: 'string',
                    default: '',
                    description: 'OAuth2 client ID for introspection',
                    displayOptions: {
                        hide: {
                            validation: ['oauth2-userinfo'],
                        },
                        show: {
                            validation: ['oauth2-introspection'],
                        },
                    },
                },
                {
                    displayName: 'Client Secret',
                    name: 'clientSecret',
                    type: 'string',
                    default: '',
                    typeOptions: { password: true },
                    description: 'OAuth2 client secret for introspection',
                    displayOptions: {
                        hide: {
                            validation: ['oauth2-userinfo'],
                        },
                        show: {
                            validation: ['oauth2-introspection'],
                        },
                    },
                },
                {
                    displayName: 'Expected Audience',
                    name: 'expectedAudience',
                    type: 'string',
                    default: '',
                    placeholder: 'https://api.example.com',
                    description: 'Value the access token must carry in its aud claim, identifying this n8n instance as the intended recipient. Leave empty to skip the check. This is not the Client ID: configure your provider to issue an audience for n8n if it does not already.',
                },
                {
                    displayName: 'Subject Claim',
                    name: 'subjectClaim',
                    type: 'string',
                    default: 'sub',
                    description: 'Token claim to use as subject identifier',
                },
            ],
        };
    }
    async getSecret(credentialId, context, handle) {
        const parsedOptions = await this.parseOptions(handle.configuration);
        const key = await this.resolveIdentifier(context, parsedOptions);
        const data = await this.storage.getCredentialData(credentialId, key, handle.resolverId, parsedOptions);
        if (!data) {
            throw new decorators_1.CredentialResolverDataNotFoundError();
        }
        const plaintext = await this.cipher.decryptV2(data);
        try {
            const secret = (0, n8n_workflow_1.jsonParse)(plaintext);
            return secret;
        }
        catch (error) {
            this.logger.error('Failed to parse decrypted credential data', { error });
            throw new decorators_1.CredentialResolverDataNotFoundError();
        }
    }
    async setSecret(credentialId, context, data, handle) {
        const parsedOptions = await this.parseOptions(handle.configuration);
        const key = await this.resolveIdentifier(context, parsedOptions);
        const encryptedData = await this.cipher.encryptV2(data);
        await this.storage.setCredentialData(credentialId, key, handle.resolverId, encryptedData, parsedOptions);
    }
    async deleteSecret(credentialId, context, handle) {
        const parsedOptions = await this.parseOptions(handle.configuration);
        const key = await this.resolveIdentifier(context, parsedOptions);
        await this.storage.deleteCredentialData(credentialId, key, handle.resolverId, parsedOptions);
    }
    async deleteAllSecrets(handle) {
        await this.storage.deleteAllCredentialData(handle);
    }
    async parseOptions(options) {
        const result = await OAuthCredentialResolverOptionsSchema.safeParseAsync(options);
        if (result.error) {
            this.logger.error('Invalid options provided to OAuthCredentialResolver', {
                error: result.error,
            });
            throw new decorators_1.CredentialResolverValidationError(`Invalid options for OAuthCredentialResolver: ${result.error.message}`);
        }
        return result.data;
    }
    async validateOptions(options) {
        const [identifier, parsedOptions] = await this.getIdentifier(options);
        await identifier.validateOptions(parsedOptions);
    }
    async getIdentifier(options) {
        const parsedOptions = await this.parseOptions(options);
        if (parsedOptions.validation === 'oauth2-introspection') {
            return [this.oAuth2TokenIntrospectionIdentifier, parsedOptions];
        }
        else {
            return [this.oAuth2UserInfoIdentifier, parsedOptions];
        }
    }
    async resolveIdentifier(context, options) {
        const [identifier, parsedOptions] = await this.getIdentifier(options);
        return await identifier.resolve(context, parsedOptions);
    }
    async validateIdentity(context, handle) {
        const parsedOptions = await this.parseOptions(handle.configuration);
        await this.resolveIdentifier(context, parsedOptions);
    }
};
exports.OAuthCredentialResolver = OAuthCredentialResolver;
exports.OAuthCredentialResolver = OAuthCredentialResolver = __decorate([
    (0, decorators_1.CredentialResolver)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, oauth2_introspection_identifier_1.OAuth2TokenIntrospectionIdentifier, oauth2_userinfo_identifier_1.OAuth2UserInfoIdentifier, dynamic_credential_entry_storage_1.DynamicCredentialEntryStorage, n8n_core_1.Cipher])
], OAuthCredentialResolver);
//# sourceMappingURL=oauth-credential-resolver.js.map