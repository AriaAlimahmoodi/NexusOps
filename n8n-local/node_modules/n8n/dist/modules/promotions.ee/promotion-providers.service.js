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
exports.PromotionProvidersService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const promotion_connection_repository_1 = require("./database/repositories/promotion-connection.repository");
const promotion_provider_repository_1 = require("./database/repositories/promotion-provider.repository");
const git_host_clients_1 = require("./git-hosts/git-host-clients");
const promotion_conflicts_1 = require("./promotion-conflicts");
const promotions_git_service_1 = require("./promotions-git.service");
const promotions_types_1 = require("./promotions.types");
let PromotionProvidersService = class PromotionProvidersService {
    constructor(providerRepository, connectionRepository, gitService, cipher, gitHosts) {
        this.providerRepository = providerRepository;
        this.connectionRepository = connectionRepository;
        this.gitService = gitService;
        this.cipher = cipher;
        this.gitHosts = gitHosts;
    }
    async create(input) {
        const hostConfig = this.resolveHostConfig(input.type, input.auth.authType, input.config);
        const { config, credentials } = await this.buildAuthentication(input.type, input.auth, hostConfig);
        await this.validateHostAccess(input.type, config, credentials);
        const auth = await this.encryptCredentials(credentials);
        const provider = await this.providerRepository.insertProvider({
            name: input.name,
            type: input.type,
            authType: input.auth.authType,
            config,
            auth,
        });
        return { provider: this.toPublic(provider), publicKey: this.publicKeyOf(provider) };
    }
    async findOne(id) {
        return this.toPublic(await this.getEntity(id));
    }
    async list(offset, limit) {
        const { data, count } = await this.providerRepository.listProviders({ offset, limit });
        return { count, data: data.map((provider) => this.toSummary(provider)) };
    }
    async listRepositories(id, query) {
        const { client, access } = await this.discoveryAccess(id);
        return await client.listRepositories(access, query);
    }
    async listBranches(id, repositoryId, query) {
        const { client, access } = await this.discoveryAccess(id);
        return await client.listBranches(access, repositoryId, query);
    }
    async discoveryAccess(id) {
        const provider = await this.getEntity(id);
        if (!(0, api_types_1.isPromotionGitHostType)(provider.type)) {
            throw new errors_1.BadRequestError('This provider has no Git host API. Use a GitLab provider to list repositories and branches.');
        }
        const config = api_types_1.promotionGitHostConfigSchema.safeParse(provider.config);
        if (!config.success) {
            throw new errors_1.BadRequestError('The stored provider config cannot be read. Update the provider to replace it.');
        }
        const credentials = await this.decryptCredentials(provider);
        if (credentials.authType !== 'token')
            throw unreadableCredentialsError();
        return {
            client: this.gitHosts.clientFor(provider.type),
            access: {
                baseUrl: config.data.baseUrl,
                accessToken: credentials.password,
            },
        };
    }
    async update(id, input) {
        if (Object.keys(input).length === 0) {
            throw new errors_1.BadRequestError('At least one field is required');
        }
        const current = await this.getEntity(id);
        const { changes, config, credentials } = await this.prepareUpdate(current, input);
        const updatesAuthentication = input.auth !== undefined || input.config !== undefined;
        if (updatesAuthentication) {
            await this.validateHostAccess(current.type, config, credentials ?? (await this.decryptCredentials(current)));
        }
        if (credentials)
            changes.auth = await this.encryptCredentials(credentials);
        if (updatesAuthentication) {
            const updated = await this.providerRepository.updateProviderIfUnchanged(id, { config: current.config, auth: current.auth }, changes);
            if (!updated) {
                throw new errors_1.ConflictError('The provider changed during the update. Reload it and try again.');
            }
        }
        else {
            await this.providerRepository.updateProvider(id, changes);
        }
        return this.toPublic(await this.getEntity(id));
    }
    async delete(id) {
        await this.getEntity(id);
        if ((await this.connectionRepository.countByProviderId(id)) > 0) {
            throw new errors_1.ConflictError('This provider is used by a connection');
        }
        await (0, promotion_conflicts_1.mapPromotionConflicts)(async () => await this.providerRepository.deleteProvider(id));
    }
    async getEntity(id) {
        const provider = await this.providerRepository.findById(id);
        if (!provider)
            throw new errors_1.NotFoundError('Promotion provider not found');
        return provider;
    }
    async prepareUpdate(current, input) {
        const changes = {};
        if (input.name !== undefined)
            changes.name = input.name;
        if (input.config !== undefined) {
            changes.config = this.resolveHostConfig(current.type, current.authType, input.config);
            if (!input.auth && !this.isSameHostUrl(current.config, input.config)) {
                throw new errors_1.BadRequestError('Changing the Git host URL requires token authentication. Send auth and config in the same request.');
            }
        }
        const config = changes.config ?? current.config;
        if (!input.auth)
            return { changes, config, credentials: undefined };
        if (input.auth.authType !== current.authType) {
            throw new errors_1.BadRequestError('A provider cannot change its authentication method. Create another provider instead.');
        }
        const requested = input.auth.authType === 'ssh-key'
            ? { ...input.auth, keyType: input.auth.keyType ?? this.storedKeyType(current) }
            : input.auth;
        const isGitHost = (0, api_types_1.isPromotionGitHostType)(current.type);
        const authentication = await this.buildAuthentication(current.type, requested, isGitHost ? config : undefined);
        if (!isGitHost)
            changes.config = authentication.config;
        return { changes, ...authentication };
    }
    isSameHostUrl(current, next) {
        const parsed = api_types_1.promotionGitHostConfigSchema.safeParse(current);
        if (!parsed.success)
            return false;
        const currentUrl = new URL(parsed.data.baseUrl).href.replace(/\/$/, '');
        const nextUrl = new URL(next.baseUrl).href.replace(/\/$/, '');
        return currentUrl === nextUrl;
    }
    async validateHostAccess(type, publicConfig, credentials) {
        if (!(0, api_types_1.isPromotionGitHostType)(type))
            return;
        const config = api_types_1.promotionGitHostConfigSchema.safeParse(publicConfig);
        if (!config.success) {
            throw new errors_1.BadRequestError('The stored provider config cannot be read. Update the provider to replace it.');
        }
        if (credentials.authType !== 'token')
            throw unreadableCredentialsError();
        await this.gitHosts.clientFor(type).validateAccess({
            baseUrl: config.data.baseUrl,
            accessToken: credentials.password,
        });
    }
    async decryptCredentials(source) {
        let stored;
        try {
            stored = (0, n8n_workflow_1.jsonParse)(await this.cipher.decryptV2(source.auth));
        }
        catch {
            throw unreadableCredentialsError();
        }
        if (source.authType === 'ssh-key') {
            const parsed = promotions_types_1.promotionSshKeyAuthPayloadSchema.safeParse(stored);
            if (!parsed.success)
                throw unreadableCredentialsError();
            return { authType: 'ssh-key', privateKey: parsed.data.privateKey };
        }
        const parsed = promotions_types_1.promotionTokenAuthPayloadSchema.safeParse(stored);
        if (!parsed.success)
            throw unreadableCredentialsError();
        return {
            authType: 'token',
            username: parsed.data.username,
            password: parsed.data.password,
        };
    }
    toPublic(provider) {
        return {
            id: provider.id,
            name: provider.name,
            type: provider.type,
            authType: provider.authType,
            config: provider.config,
            createdAt: provider.createdAt.toISOString(),
            updatedAt: provider.updatedAt.toISOString(),
        };
    }
    toSummary(provider) {
        const { config: _, ...summary } = this.toPublic(provider);
        return summary;
    }
    resolveHostConfig(type, authType, config) {
        if (!(0, api_types_1.supportsPromotionAuthType)(type, authType)) {
            throw new errors_1.BadRequestError(`A ${type} provider does not support ${authType} authentication`);
        }
        if ((0, api_types_1.isPromotionGitHostType)(type)) {
            if (!config)
                throw new errors_1.BadRequestError(`A ${type} provider requires a config with a base URL`);
            return config;
        }
        if (config)
            throw new errors_1.BadRequestError('A git provider does not take a config');
        return undefined;
    }
    async buildAuthentication(type, auth, hostConfig) {
        if (auth.authType === 'ssh-key') {
            const keyPair = await this.gitService.generateSshKeyPair(auth.keyType);
            return {
                config: hostConfig ?? {
                    schemaVersion: 1,
                    publicKey: keyPair.publicKey,
                    keyType: auth.keyType,
                },
                credentials: { authType: 'ssh-key', privateKey: keyPair.privateKey },
            };
        }
        const username = api_types_1.promotionProviderTypeCapabilities[type].tokenUsername ?? auth.username;
        if (username === undefined) {
            throw new errors_1.BadRequestError('This provider requires a username for token authentication. Send username and password together.');
        }
        this.assertUsableCredentials(username, auth.password);
        return {
            config: hostConfig ?? { schemaVersion: 1 },
            credentials: { authType: 'token', username, password: auth.password },
        };
    }
    async encryptCredentials(credentials) {
        const { authType: _, ...payload } = credentials;
        return await this.cipher.encryptV2(JSON.stringify({ schemaVersion: 1, ...payload }));
    }
    assertUsableCredentials(username, password) {
        if ([username, password].some((value) => /[\r\n\0]/.test(value))) {
            throw new errors_1.BadRequestError('Credentials contain unsupported characters');
        }
    }
    publicKeyOf(provider) {
        const parsed = api_types_1.promotionGitSshKeyConfigSchema.safeParse(provider.config);
        return parsed.success ? parsed.data.publicKey : null;
    }
    storedKeyType(provider) {
        const parsed = api_types_1.promotionGitSshKeyConfigSchema.safeParse(provider.config);
        return parsed.success ? parsed.data.keyType : 'ed25519';
    }
};
exports.PromotionProvidersService = PromotionProvidersService;
exports.PromotionProvidersService = PromotionProvidersService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [promotion_provider_repository_1.PromotionProviderRepository, promotion_connection_repository_1.PromotionConnectionRepository, promotions_git_service_1.PromotionsGitService, n8n_core_1.Cipher, git_host_clients_1.GitHostClients])
], PromotionProvidersService);
function unreadableCredentialsError() {
    return new errors_1.BadRequestError('The stored provider credentials cannot be read. Update the provider to replace them.');
}
//# sourceMappingURL=promotion-providers.service.js.map