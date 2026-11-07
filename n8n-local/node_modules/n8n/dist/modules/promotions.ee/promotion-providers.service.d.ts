import type { CreatePromotionProviderDto, PromotionProviderAuthType, PromotionProviderCreatedPublicDto, PromotionProviderPublicDto, UpdatePromotionProviderDto } from '@n8n/api-types';
import { Cipher } from 'n8n-core';
import type { PromotionProvider } from './database/entities/promotion-provider.entity';
import { PromotionConnectionRepository } from './database/repositories/promotion-connection.repository';
import { PromotionProviderRepository } from './database/repositories/promotion-provider.repository';
import { GitHostClients } from './git-hosts/git-host-clients';
import type { GitHostDiscoveryQuery } from './git-hosts/git-host.types';
import { PromotionsGitService } from './promotions-git.service';
import { type PromotionGitCredentials } from './promotions.types';
export declare class PromotionProvidersService {
    private readonly providerRepository;
    private readonly connectionRepository;
    private readonly gitService;
    private readonly cipher;
    private readonly gitHosts;
    constructor(providerRepository: PromotionProviderRepository, connectionRepository: PromotionConnectionRepository, gitService: PromotionsGitService, cipher: Cipher, gitHosts: GitHostClients);
    create(input: CreatePromotionProviderDto): Promise<PromotionProviderCreatedPublicDto>;
    findOne(id: string): Promise<PromotionProviderPublicDto>;
    list(offset: number, limit: number): Promise<{
        count: number;
        data: {
            id: string;
            name: string;
            type: "git" | "gitlab";
            authType: "ssh-key" | "token";
            createdAt: string;
            updatedAt: string;
        }[];
    }>;
    listRepositories(id: string, query: GitHostDiscoveryQuery): Promise<import("./git-hosts/git-host.types").GitHostPage<{
        id: string;
        name: string;
        fullPath: string;
        remoteUrl: string;
        defaultBranch: string | null;
    }>>;
    listBranches(id: string, repositoryId: string, query: GitHostDiscoveryQuery): Promise<import("./git-hosts/git-host.types").GitHostPage<{
        name: string;
        isDefault: boolean;
    }>>;
    private discoveryAccess;
    update(id: string, input: UpdatePromotionProviderDto): Promise<PromotionProviderPublicDto>;
    delete(id: string): Promise<void>;
    getEntity(id: string): Promise<PromotionProvider>;
    private prepareUpdate;
    private isSameHostUrl;
    private validateHostAccess;
    decryptCredentials(source: {
        authType: PromotionProviderAuthType;
        auth: string;
    }): Promise<PromotionGitCredentials>;
    toPublic(provider: PromotionProvider): PromotionProviderPublicDto;
    toSummary(provider: PromotionProvider): {
        id: string;
        name: string;
        type: "git" | "gitlab";
        authType: "ssh-key" | "token";
        createdAt: string;
        updatedAt: string;
    };
    private resolveHostConfig;
    private buildAuthentication;
    private encryptCredentials;
    private assertUsableCredentials;
    private publicKeyOf;
    private storedKeyType;
}
