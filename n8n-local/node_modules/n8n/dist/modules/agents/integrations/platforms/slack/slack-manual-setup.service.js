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
exports.SlackManualSetupService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const node_crypto_1 = require("node:crypto");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const project_service_ee_1 = require("../../../../../services/project.service.ee");
const slack_methods_service_1 = require("./slack-methods.service");
const slack_setup_types_1 = require("./slack-setup.types");
const integration_helpers_1 = require("../../integration-helpers");
let SlackManualSetupService = class SlackManualSetupService {
    constructor(methods, userRepository, cacheService, projectService) {
        this.methods = methods;
        this.userRepository = userRepository;
        this.cacheService = cacheService;
        this.projectService = projectService;
    }
    async createApp(options) {
        const appConfigurationToken = options.appConfigurationToken.trim();
        if (!appConfigurationToken) {
            throw new errors_1.BadRequestError('Slack app configuration token is required');
        }
        const agent = await this.methods.getAgent(options.agentId, options.projectId);
        const redirectUrl = this.methods.callbackUrl(options.projectId, options.agentId);
        const manifest = this.methods.buildManifest(agent.name, options.projectId, options.agentId, {
            redirectUrl,
        });
        const response = await this.methods.callSlackApi('apps.manifest.create', {
            token: appConfigurationToken,
            manifest: JSON.stringify(manifest),
        });
        if (!response.ok) {
            throw this.methods.slackError('create the Slack app', response);
        }
        return await this.createInstallSession(options, redirectUrl, response);
    }
    async getManifest(options) {
        const agent = await this.methods.getAgent(options.agentId, options.projectId);
        return {
            manifest: this.methods.buildManifest(agent.name, options.projectId, options.agentId),
        };
    }
    async completeInstall(options) {
        const session = await this.consumeSession(options.state);
        if (session.projectId !== options.projectId || session.agentId !== options.agentId) {
            throw new errors_1.BadRequestError('Slack app setup state does not match this agent');
        }
        const user = await this.getInstallUser(session);
        const agent = await this.methods.getAgent(session.agentId, session.projectId);
        const { accessToken, teamName } = await this.exchangeInstallCode(session, options.code);
        await this.methods.connectBotCredential(agent, user, accessToken, {
            ...session,
            ...(teamName ? { teamName } : {}),
        });
    }
    async consumeSession(state) {
        const cached = await this.cacheService.take((0, slack_setup_types_1.slackSetupCacheKey)(state));
        if (typeof cached !== 'string') {
            throw new errors_1.BadRequestError('Slack app setup state has expired or is invalid');
        }
        const session = await this.methods.decodeSession(cached);
        if (session)
            return session;
        throw new errors_1.BadRequestError('Slack app setup state has expired or is invalid');
    }
    async createInstallSession(options, redirectUrl, response) {
        const { appId, clientId, clientSecret, signingSecret, oauthAuthorizeUrl } = (0, slack_setup_types_1.parseSlackAppSetupResponse)(response);
        const state = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const setupSession = {
            projectId: options.projectId,
            agentId: options.agentId,
            userId: options.user.id,
            appId,
            clientId,
            clientSecret,
            signingSecret,
            redirectUrl,
        };
        await this.methods.storeSession(state, setupSession);
        return {
            appId,
            installUrl: this.methods.installUrl(oauthAuthorizeUrl, state, redirectUrl),
        };
    }
    async getInstallUser(session) {
        const user = await this.userRepository.findOne({
            where: { id: session.userId },
            relations: ['role'],
        });
        if (!user)
            throw new errors_1.NotFoundError(`User "${session.userId}" not found`);
        const project = await this.projectService.getProjectWithScope(user, session.projectId, [
            'agent:update',
            'credential:create',
        ]);
        if (!project) {
            throw new errors_1.ForbiddenError('You do not have permission to complete Slack app setup');
        }
        return user;
    }
    async exchangeInstallCode(session, code) {
        const tokenResponse = await this.methods.callSlackApi('oauth.v2.access', {
            code,
            redirect_uri: session.redirectUrl,
        }, {
            authorization: `Basic ${Buffer.from(`${session.clientId}:${session.clientSecret}`).toString('base64')}`,
        });
        if (!tokenResponse.ok) {
            throw this.methods.slackError('finish Slack app installation', tokenResponse);
        }
        const accessToken = (0, integration_helpers_1.stringProperty)(tokenResponse, 'access_token');
        if (!accessToken?.startsWith('xoxb-')) {
            throw new errors_1.BadRequestError('Slack did not return a Bot User OAuth Token');
        }
        const team = (0, slack_setup_types_1.childRecord)(tokenResponse, 'team');
        const teamName = (0, integration_helpers_1.stringProperty)(team, 'name');
        return { accessToken, teamName };
    }
};
exports.SlackManualSetupService = SlackManualSetupService;
exports.SlackManualSetupService = SlackManualSetupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [slack_methods_service_1.SlackMethodsService, db_1.UserRepository, backend_services_1.CacheService, project_service_ee_1.ProjectService])
], SlackManualSetupService);
//# sourceMappingURL=slack-manual-setup.service.js.map