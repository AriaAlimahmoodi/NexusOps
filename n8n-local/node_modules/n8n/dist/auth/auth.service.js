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
exports.AuthService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const crypto_1 = require("crypto");
const jsonwebtoken_1 = require("jsonwebtoken");
const escapeRegExp_1 = __importDefault(require("lodash/escapeRegExp"));
const constants_2 = require("../constants");
const errors_1 = require("@n8n/errors");
const license_1 = require("../license");
const mfa_service_1 = require("../mfa/mfa.service");
const backend_services_1 = require("@n8n/backend-services");
function isIssuedJWT(payload) {
    if (!(0, is_record_1.isRecord)(payload))
        return false;
    const { id, hash, exp, browserId, usedMfa, isEmbed } = payload;
    return (typeof id === 'string' &&
        id.length > 0 &&
        typeof hash === 'string' &&
        Number.isFinite(exp) &&
        (browserId === undefined || typeof browserId === 'string') &&
        (usedMfa === undefined || typeof usedMfa === 'boolean') &&
        (isEmbed === undefined || typeof isEmbed === 'boolean'));
}
let AuthService = class AuthService {
    constructor(eventService, globalConfig, logger, license, jwtService, urlService, userRepository, invalidAuthTokenRepository, mfaService) {
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.license = license;
        this.jwtService = jwtService;
        this.urlService = urlService;
        this.userRepository = userRepository;
        this.invalidAuthTokenRepository = invalidAuthTokenRepository;
        this.mfaService = mfaService;
        const restEndpoint = globalConfig.endpoints.rest;
        this.skipBrowserIdCheckEndpoints = [
            `/${restEndpoint}/push`,
            `/${restEndpoint}/binary-data/`,
            `/${restEndpoint}/oauth1-credential/callback`,
            `/${restEndpoint}/oauth2-credential/callback`,
            `/${restEndpoint}/credentials/:id/authorize`,
            '/types/nodes.json',
            '/types/credentials.json',
            '/types/node-versions.json',
            '/mcp-oauth/authorize/',
            `/${restEndpoint}/chat/conversations/:sessionId/messages/:messageId/attachments/:index`,
            `/${restEndpoint}/instance-ai/events/:threadId`,
            new RegExp(`^/${(0, escapeRegExp_1.default)(restEndpoint)}/projects/[^/]+/agents/v2/:agentId/(?:n8n-)?chat/attachments/:attachmentId$`),
        ];
    }
    createAuthMiddleware({ allowSkipMFA, allowSkipPreviewAuth, allowUnauthenticated, }) {
        return async (req, res, next) => {
            const token = req.cookies[constants_2.AUTH_COOKIE_NAME];
            if (token) {
                try {
                    const isInvalid = await this.invalidAuthTokenRepository.existsBy({ token });
                    if (isInvalid)
                        throw new errors_1.AuthError('Unauthorized');
                    const [user, { usedMfa }] = await this.resolveJwt(token, req, res);
                    const mfaEnforced = await this.mfaService.isMFAEnforced();
                    if (mfaEnforced && !usedMfa && !allowSkipMFA) {
                        if (user.mfaEnabled) {
                            throw new errors_1.AuthError('MFA not used during authentication');
                        }
                        else {
                            if (allowUnauthenticated) {
                                req.authInfo = {
                                    usedMfa,
                                    mfaEnrollmentRequired: true,
                                };
                                return next();
                            }
                            res.status(401).json({ status: 'error', message: 'Unauthorized', mfaRequired: true });
                            return;
                        }
                    }
                    req.user = user;
                    req.authInfo = {
                        usedMfa,
                    };
                }
                catch (error) {
                    if (error instanceof jsonwebtoken_1.JsonWebTokenError || error instanceof errors_1.AuthError) {
                        this.clearCookie(res);
                    }
                    else {
                        throw error;
                    }
                }
            }
            const isPreviewMode = process.env.N8N_PREVIEW_MODE === 'true';
            const shouldSkipAuth = (allowSkipPreviewAuth && isPreviewMode) || allowUnauthenticated;
            if (Object.hasOwn(req, 'user') && req.user)
                next();
            else if (shouldSkipAuth)
                next();
            else
                res.status(401).json({ status: 'error', message: 'Unauthorized' });
        };
    }
    createAssetAuthMiddleware() {
        return (req, res, next) => {
            const token = this.getCookieToken(req);
            if (token) {
                try {
                    const payload = this.jwtService.verify('session', token, {
                        algorithms: ['HS256'],
                    });
                    if (this.isAuthJwtPayload(payload)) {
                        next();
                        return;
                    }
                }
                catch { }
            }
            if (process.env.N8N_PREVIEW_MODE === 'true') {
                next();
                return;
            }
            res.sendStatus(404);
        };
    }
    isAuthJwtPayload(payload) {
        return (0, is_record_1.isRecord)(payload) && typeof payload.id === 'string' && typeof payload.hash === 'string';
    }
    getCookieToken(req) {
        if (typeof req.cookies === 'object' && req.cookies !== null) {
            const cookies = req.cookies;
            return cookies[constants_2.AUTH_COOKIE_NAME];
        }
        return undefined;
    }
    getBrowserId(req) {
        if ('browserId' in req && typeof req.browserId === 'string') {
            return req.browserId;
        }
        return undefined;
    }
    getMethod(req) {
        return req.method;
    }
    getEndpoint(req) {
        return req.route ? `${req.baseUrl}${req.route.path}` : req.baseUrl;
    }
    clearCookie(res) {
        res.clearCookie(constants_2.AUTH_COOKIE_NAME);
    }
    async invalidateToken(req) {
        const token = req.cookies[constants_2.AUTH_COOKIE_NAME];
        if (!token)
            return;
        try {
            const { exp } = this.jwtService.decodeUnverified(token);
            if (exp) {
                await this.invalidAuthTokenRepository.insert({
                    token,
                    expiresAt: new Date(exp * 1000),
                });
            }
        }
        catch (e) {
            this.logger.warn('failed to invalidate auth token', { error: e.message });
        }
    }
    issueCookie(res, user, usedMfa, browserId, isEmbed, cookieOverrides) {
        this.setAuthCookie(res, user, usedMfa, browserId, isEmbed, cookieOverrides);
        this.eventService.emit('experiment-user-first-login', { userId: user.id, at: Date.now() });
    }
    setAuthCookie(res, user, usedMfa, browserId, isEmbed, cookieOverrides) {
        const isWithinUsersLimit = this.license.isWithinUsersLimit();
        if (user.role.slug !== db_1.GLOBAL_OWNER_ROLE.slug && !isWithinUsersLimit) {
            throw new errors_1.ForbiddenError(constants_2.RESPONSE_ERROR_MESSAGES.USERS_QUOTA_REACHED);
        }
        const token = this.issueJWT(user, usedMfa, browserId, isEmbed);
        const { samesite, secure } = this.globalConfig.auth.cookie;
        res.cookie(constants_2.AUTH_COOKIE_NAME, token, {
            maxAge: this.jwtExpiration * constants_1.Time.seconds.toMilliseconds,
            httpOnly: true,
            sameSite: cookieOverrides?.sameSite ?? samesite,
            secure: cookieOverrides?.secure ?? secure,
        });
    }
    issueJWT(user, usedMfa = false, browserId, isEmbed) {
        const payload = {
            id: user.id,
            hash: this.createJWTHash(user),
            browserId: browserId && this.hash(browserId),
            usedMfa,
            ...(isEmbed && { isEmbed }),
        };
        return this.jwtService.sign('session', payload, {
            expiresIn: this.jwtExpiration,
        });
    }
    async validateCookieToken(token) {
        const isInvalid = await this.invalidAuthTokenRepository.existsBy({ token });
        if (isInvalid)
            throw new errors_1.AuthError('Unauthorized');
        const { user } = await this.validateToken(token);
        return user;
    }
    async authenticateUserBasedOnToken(token, method, endpoint, browserId) {
        const isInvalid = await this.invalidAuthTokenRepository.existsBy({ token });
        if (isInvalid)
            throw new errors_1.AuthError('Unauthorized');
        const { user, jwtPayload } = await this.validateToken(token);
        this.validateBrowserId(jwtPayload, browserId, endpoint, method);
        await this.checkMfaGate(user, jwtPayload);
        return user;
    }
    async authenticateUserByCookie(cookie) {
        const isInvalid = await this.invalidAuthTokenRepository.existsBy({ token: cookie });
        if (isInvalid)
            throw new errors_1.AuthError('Unauthorized');
        const { user, jwtPayload } = await this.validateToken(cookie);
        await this.checkMfaGate(user, jwtPayload);
        return user;
    }
    async checkMfaGate(user, jwtPayload) {
        if (jwtPayload.usedMfa ?? false) {
            return;
        }
        const mfaEnforced = await this.mfaService.isMFAEnforced();
        if (!mfaEnforced && !user.mfaEnabled) {
            return;
        }
        throw new errors_1.AuthError('Unauthorized');
    }
    endpointSkipsBrowserIdCheck(endpoint) {
        return this.skipBrowserIdCheckEndpoints.some((entry) => typeof entry === 'string' ? entry === endpoint : entry.test(endpoint));
    }
    validateBrowserId(jwtPayload, browserId, endpoint, method) {
        if (method === 'GET' && this.endpointSkipsBrowserIdCheck(endpoint)) {
            this.logger.debug(`Skipped browserId check on ${endpoint}`);
        }
        else if (jwtPayload.browserId &&
            (!browserId || jwtPayload.browserId !== this.hash(browserId))) {
            this.logger.warn(`browserId check failed on ${endpoint}`);
            throw new errors_1.AuthError('Unauthorized');
        }
    }
    async validateToken(token) {
        const jwtPayload = this.jwtService.verify('session', token, {
            algorithms: ['HS256'],
        });
        if (!isIssuedJWT(jwtPayload))
            throw new errors_1.AuthError('Unauthorized');
        const user = await this.userRepository.findOne({
            where: { id: jwtPayload.id },
            relations: ['role'],
        });
        if (!user ||
            user.disabled ||
            jwtPayload.hash !== this.createJWTHash(user)) {
            throw new errors_1.AuthError('Unauthorized');
        }
        return {
            user,
            jwtPayload,
        };
    }
    async resolveJwt(token, req, res) {
        const { user, jwtPayload } = await this.validateToken(token);
        const browserId = this.getBrowserId(req);
        const endpoint = this.getEndpoint(req);
        const method = this.getMethod(req);
        this.validateBrowserId(jwtPayload, browserId, endpoint, method);
        if (jwtPayload.exp * 1000 - Date.now() < this.jwtRefreshTimeout) {
            this.logger.debug('JWT about to expire. Will be refreshed');
            const embedCookieOverrides = jwtPayload.isEmbed
                ? { sameSite: 'none', secure: true }
                : undefined;
            this.setAuthCookie(res, user, jwtPayload.usedMfa ?? false, browserId, jwtPayload.isEmbed, embedCookieOverrides);
        }
        return [user, { usedMfa: jwtPayload.usedMfa ?? false }];
    }
    generateEmailChangeUrl(user, newEmail) {
        const payload = {
            sub: user.id,
            newEmail,
            hash: this.createJWTHash(user),
        };
        const token = this.jwtService.sign('emailChange', payload, { expiresIn: '20m' });
        const url = new URL(`${this.urlService.getInstanceBaseUrl()}/confirm-email-change`);
        url.searchParams.append('token', token);
        return url.toString();
    }
    async resolveEmailChangeToken(token) {
        let decoded;
        try {
            decoded = this.jwtService.verify('emailChange', token);
        }
        catch {
            return;
        }
        const user = await this.userRepository.findOne({
            where: { id: decoded.sub },
            relations: ['authIdentities', 'role'],
        });
        if (!user)
            return;
        if (decoded.hash !== this.createJWTHash(user))
            return;
        return { user, newEmail: decoded.newEmail };
    }
    generatePasswordResetToken(user, expiresIn = '20m') {
        const payload = { sub: user.id, hash: this.createJWTHash(user) };
        return this.jwtService.sign('passwordReset', payload, { expiresIn });
    }
    generatePasswordResetUrl(user) {
        const instanceBaseUrl = this.urlService.getInstanceBaseUrl();
        const url = new URL(`${instanceBaseUrl}/change-password`);
        url.searchParams.append('token', this.generatePasswordResetToken(user));
        url.searchParams.append('mfaEnabled', user.mfaEnabled.toString());
        return url.toString();
    }
    async resolvePasswordResetToken(token) {
        let decodedToken;
        try {
            decodedToken = this.jwtService.verify('passwordReset', token);
        }
        catch (e) {
            if (e instanceof jsonwebtoken_1.TokenExpiredError) {
                this.logger.debug('Reset password token expired');
            }
            else {
                this.logger.debug('Error verifying token');
            }
            return;
        }
        const user = await this.userRepository.findOne({
            where: { id: decodedToken.sub },
            relations: ['authIdentities', 'role'],
        });
        if (!user) {
            this.logger.debug('Request to resolve password token failed because no user was found for the provided user ID', { userId: decodedToken.sub });
            return;
        }
        if (decodedToken.hash !== this.createJWTHash(user)) {
            this.logger.debug('Password updated since this token was generated');
            return;
        }
        return user;
    }
    createJWTHash({ email, password, mfaEnabled, mfaSecret }) {
        const payload = [email, password];
        if (mfaEnabled && mfaSecret) {
            payload.push(mfaSecret);
        }
        return this.hash(payload.join(':')).substring(0, 10);
    }
    hash(input) {
        return (0, crypto_1.createHash)('sha256').update(input).digest('base64');
    }
    get jwtRefreshTimeout() {
        const { jwtRefreshTimeoutHours, jwtSessionDurationHours } = this.globalConfig.userManagement;
        if (jwtRefreshTimeoutHours === 0) {
            return Math.floor(jwtSessionDurationHours * 0.25 * constants_1.Time.hours.toMilliseconds);
        }
        else {
            return Math.floor(jwtRefreshTimeoutHours * constants_1.Time.hours.toMilliseconds);
        }
    }
    get jwtExpiration() {
        return this.globalConfig.userManagement.jwtSessionDurationHours * constants_1.Time.hours.toSeconds;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, config_1.GlobalConfig, backend_common_1.Logger, license_1.License, backend_services_1.JwtService, backend_services_1.UrlService, db_1.UserRepository, db_1.InvalidAuthTokenRepository, mfa_service_1.MfaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map