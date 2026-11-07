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
exports.SlackSignatureIdentifier = exports.SlackSignatureOptionsSchema = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const querystring_1 = require("querystring");
const zod_1 = require("zod");
const identifier_interface_1 = require("./identifier-interface");
const MAX_TIMESTAMP_AGE_SECONDS = 300;
const SlackIdentitySchema = zod_1.z.object({
    identity: zod_1.z.string(),
    version: zod_1.z.number(),
    metadata: zod_1.z.object({
        source: zod_1.z.literal('slack-signature'),
        timestamp: zod_1.z.string(),
        signature: zod_1.z.string(),
    }),
});
exports.SlackSignatureOptionsSchema = zod_1.z.object({
    signingSecret: zod_1.z.string().min(1, 'Slack signing secret is required'),
    subjectClaim: zod_1.z.enum(['user_id', 'team_user']).default('user_id'),
});
const FlatPayloadSchema = zod_1.z.object({
    user_id: zod_1.z.string(),
    team_id: zod_1.z.string().optional(),
    enterprise_id: zod_1.z.string().optional(),
});
const InteractivePayloadSchema = zod_1.z.object({
    user: zod_1.z.object({ id: zod_1.z.string().optional() }),
    team: zod_1.z.object({ id: zod_1.z.string() }).optional(),
    enterprise: zod_1.z.object({ id: zod_1.z.string() }).optional(),
});
const EventPayloadSchema = zod_1.z.object({
    event: zod_1.z.object({ user: zod_1.z.string().optional() }),
    team_id: zod_1.z.string().optional(),
    enterprise_id: zod_1.z.string().optional(),
});
let SlackSignatureIdentifier = class SlackSignatureIdentifier {
    constructor(logger) {
        this.logger = logger;
    }
    async validateOptions(identifierOptions) {
        const result = exports.SlackSignatureOptionsSchema.safeParse(identifierOptions);
        if (!result.success) {
            throw new identifier_interface_1.IdentifierValidationError(`Invalid Slack identifier options: ${result.error.message}`);
        }
    }
    async resolve(context, identifierOptions) {
        const options = this.parseOptions(identifierOptions);
        const result = SlackIdentitySchema.safeParse(context);
        if (!result.success) {
            throw new identifier_interface_1.IdentifierValidationError('Missing Slack signature verification data');
        }
        this.verifySlackSignature(options.signingSecret, result.data.metadata.timestamp, result.data.identity, result.data.metadata.signature);
        this.logger.debug('Slack signature verified');
        return this.deriveKey(result.data.identity, options);
    }
    resolveKey(context, identifierOptions) {
        const options = this.parseOptions(identifierOptions);
        const result = SlackIdentitySchema.safeParse(context);
        if (!result.success) {
            throw new identifier_interface_1.IdentifierValidationError('Missing Slack signature verification data');
        }
        return this.deriveKey(result.data.identity, options);
    }
    deriveKey(identity, options) {
        const { userId, teamId } = this.extractSlackIdentity(identity);
        if (!userId) {
            throw new identifier_interface_1.IdentifierValidationError('Slack user_id not found in identity');
        }
        if (options.subjectClaim === 'team_user') {
            if (!teamId) {
                throw new identifier_interface_1.IdentifierValidationError('Slack team_id not found for team_user claim');
            }
            return `${teamId}:${userId}`;
        }
        return userId;
    }
    parseOptions(options) {
        const result = exports.SlackSignatureOptionsSchema.safeParse(options);
        if (!result.success) {
            this.logger.error('Invalid Slack identifier options', { error: result.error });
            throw new identifier_interface_1.IdentifierValidationError(`Invalid Slack identifier options: ${result.error.message}`);
        }
        return result.data;
    }
    verifySlackSignature(signingSecret, timestamp, rawBody, providedSignature) {
        const timestampNum = parseInt(timestamp, 10);
        if (isNaN(timestampNum)) {
            throw new identifier_interface_1.IdentifierValidationError('Invalid Slack request timestamp');
        }
        const currentTimeSec = Math.floor(Date.now() / 1000);
        if (Math.abs(currentTimeSec - timestampNum) > MAX_TIMESTAMP_AGE_SECONDS) {
            throw new identifier_interface_1.IdentifierValidationError('Slack request timestamp is too old');
        }
        const hmac = (0, crypto_1.createHmac)('sha256', signingSecret);
        hmac.update(`v0:${timestamp}:${rawBody}`);
        const expectedSignature = `v0=${hmac.digest('hex')}`;
        const expectedBuffer = Buffer.from(expectedSignature);
        const actualBuffer = Buffer.from(providedSignature);
        if (expectedBuffer.length !== actualBuffer.length ||
            !(0, crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer)) {
            throw new identifier_interface_1.IdentifierValidationError('Slack signature verification failed');
        }
    }
    extractSlackIdentity(body) {
        const parsedBody = (0, querystring_1.parse)(body);
        return (this.extractFlatFieldBody(parsedBody) ??
            this.extractInteractivePayloadBody(parsedBody) ??
            this.extractEventPayloadBody(parsedBody) ?? {
            userId: undefined,
            teamId: undefined,
        });
    }
    extractFlatFieldBody(body) {
        const result = FlatPayloadSchema.safeParse(body);
        if (!result.success)
            return undefined;
        return {
            userId: result.data.user_id,
            teamId: result.data.team_id,
        };
    }
    extractInteractivePayloadBody(body) {
        const result = InteractivePayloadSchema.safeParse(body);
        if (!result.success)
            return undefined;
        return {
            userId: result.data.user.id,
            teamId: result.data.team?.id,
        };
    }
    extractEventPayloadBody(body) {
        const result = EventPayloadSchema.safeParse(body);
        if (!result.success)
            return undefined;
        return {
            userId: result.data.event.user,
            teamId: result.data.team_id,
        };
    }
};
exports.SlackSignatureIdentifier = SlackSignatureIdentifier;
exports.SlackSignatureIdentifier = SlackSignatureIdentifier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], SlackSignatureIdentifier);
//# sourceMappingURL=slack-signature-identifier.js.map