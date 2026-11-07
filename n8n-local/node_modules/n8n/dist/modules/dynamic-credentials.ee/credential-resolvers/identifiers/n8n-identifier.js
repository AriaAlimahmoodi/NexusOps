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
exports.N8NIdentifier = exports.N8N_IDENTITY_SOURCES = exports.N8NIdentifierMetadataSchema = void 0;
exports.carriesN8nIdentity = carriesN8nIdentity;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const auth_service_1 = require("../../../../auth/auth.service");
const v4_1 = require("zod/v4");
const decorators_1 = require("@n8n/decorators");
const auth_1 = require("@n8n/backend-services/auth");
const inbound_auth_1 = require("@n8n/inbound-auth");
const db_1 = require("@n8n/db");
const MANUAL_EXECUTION_SOURCE = 'manual-execution';
const REQUEST_BOUND_SOURCES = ['chat-hub-injected', 'cookie-source'];
const N8N_OAUTH_SOURCE = 'n8n-oauth';
const ManualExecutionMetadataSchema = v4_1.z.object({
    source: v4_1.z.literal(MANUAL_EXECUTION_SOURCE),
});
const RequestBoundMetadataSchema = v4_1.z.object({
    source: v4_1.z.enum(REQUEST_BOUND_SOURCES),
    method: v4_1.z.string(),
    endpoint: v4_1.z.string(),
    browserId: v4_1.z.string().optional(),
});
exports.N8NIdentifierMetadataSchema = v4_1.z.discriminatedUnion('source', [
    ManualExecutionMetadataSchema,
    RequestBoundMetadataSchema,
    n8n_workflow_1.N8NOAuthMetadataSchema,
]);
function describeIssues(error) {
    return error.issues
        .map(({ path, message }) => path.length > 0 ? `${path.map(String).join('.')}: ${message}` : message)
        .join('; ');
}
exports.N8N_IDENTITY_SOURCES = [
    MANUAL_EXECUTION_SOURCE,
    ...REQUEST_BOUND_SOURCES,
    N8N_OAUTH_SOURCE,
];
function carriesN8nIdentity(context) {
    const source = context.metadata?.source;
    return typeof source === 'string' && exports.N8N_IDENTITY_SOURCES.includes(source);
}
let N8NIdentifier = class N8NIdentifier {
    constructor(logger, authService, oauthTokenVerifierProxy, trustedSourceGate, userRepository) {
        this.logger = logger;
        this.authService = authService;
        this.oauthTokenVerifierProxy = oauthTokenVerifierProxy;
        this.trustedSourceGate = trustedSourceGate;
        this.userRepository = userRepository;
    }
    async validateOptions(_) {
        return;
    }
    async resolve(context, _, executionId) {
        const metadataResult = this.parseMetadata(context.metadata);
        if (!metadataResult.success) {
            throw new decorators_1.CredentialResolverError(`Invalid context metadata: ${metadataResult.error}`);
        }
        if (metadataResult.data.source === 'manual-execution') {
            const user = await this.authService.authenticateUserByCookie(context.identity);
            return user.id;
        }
        if (metadataResult.data.source === 'n8n-oauth') {
            if (metadataResult.data.subject) {
                const userId = metadataResult.data.subject;
                const executionPath = metadataResult.data.executionPath ?? [];
                if (executionId) {
                    if (!executionPath.includes(executionId)) {
                        throw new decorators_1.CredentialResolverError('Sealed identity is not valid for this execution');
                    }
                }
                else if (executionPath.length > 0) {
                    throw new decorators_1.CredentialResolverError('Sealed identity is not valid for this execution');
                }
                const authorized = await this.isSealedSubjectAuthorized(userId, metadataResult.data);
                if (!authorized) {
                    throw new decorators_1.CredentialResolverError(`Invalid OAuth token for resource ${metadataResult.data.resource}`);
                }
                return userId;
            }
            const user = await this.oauthTokenVerifierProxy.verifyOAuthAccessToken(context.identity, metadataResult.data.resource, metadataResult.data.grant);
            if (!user?.user) {
                throw new decorators_1.CredentialResolverError(`Invalid OAuth token for resource ${metadataResult.data.resource}`);
            }
            return user.user.id;
        }
        const user = await this.authService.authenticateUserBasedOnToken(context.identity, metadataResult.data.method, metadataResult.data.endpoint, metadataResult.data.browserId);
        return user.id;
    }
    async identify(context) {
        const metadataResult = this.parseMetadata(context.metadata);
        if (!metadataResult.success)
            return undefined;
        try {
            if (metadataResult.data.source === 'manual-execution') {
                const user = await this.authService.authenticateUserByCookie(context.identity);
                return user.id;
            }
            if (metadataResult.data.source === 'n8n-oauth') {
                const { subject } = metadataResult.data;
                if (subject) {
                    const authorized = await this.isSealedSubjectAuthorized(subject, metadataResult.data);
                    return authorized ? subject : undefined;
                }
                const verified = await this.oauthTokenVerifierProxy.verifyOAuthAccessToken(context.identity, metadataResult.data.resource, metadataResult.data.grant);
                return verified?.user?.id;
            }
            const user = await this.authService.authenticateUserBasedOnToken(context.identity, metadataResult.data.method, metadataResult.data.endpoint, metadataResult.data.browserId);
            return user.id;
        }
        catch (error) {
            this.logger.warn('Could not identify the executing user for redaction attribution', {
                source: metadataResult.data.source,
                error,
            });
            return undefined;
        }
    }
    parseMetadata(metadata) {
        const result = exports.N8NIdentifierMetadataSchema.safeParse(metadata);
        if (result.success)
            return { success: true, data: result.data };
        const error = describeIssues(result.error);
        this.logger.warn('Identity metadata is invalid', { error });
        return { success: false, error };
    }
    async isSealedSubjectAuthorized(userId, metadata) {
        if (metadata.version === 2) {
            return await this.trustedSourceGate.authorizeSealed({
                userId,
                grant: metadata.grant,
                binding: metadata.binding,
            });
        }
        return await this.isLegacySealedSubjectAuthorized(userId, metadata);
    }
    async isLegacySealedSubjectAuthorized(userId, { grant, binding }) {
        if (grant)
            return await this.trustedSourceGate.authorizeSealed({ userId, grant, binding });
        const user = await this.userRepository.findOneBy({ id: userId });
        return !!user && !user.disabled;
    }
};
exports.N8NIdentifier = N8NIdentifier;
exports.N8NIdentifier = N8NIdentifier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, auth_service_1.AuthService, auth_1.OAuthTokenVerifierProxy, inbound_auth_1.TrustedSourceGate, db_1.UserRepository])
], N8NIdentifier);
//# sourceMappingURL=n8n-identifier.js.map