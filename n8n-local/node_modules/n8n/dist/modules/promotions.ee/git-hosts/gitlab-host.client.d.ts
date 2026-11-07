import { type PromotionBranch, type PromotionRepository } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { GitHostAccess, GitHostClient, GitHostDiscoveryQuery, GitHostPage } from './git-host.types';
export declare class GitLabHostClient implements GitHostClient {
    private readonly logger;
    private readonly http;
    constructor(outboundHttp: OutboundHttp, logger: Logger);
    validateAccess(access: GitHostAccess): Promise<void>;
    listRepositories(access: GitHostAccess, { offset, limit, search }: GitHostDiscoveryQuery): Promise<GitHostPage<PromotionRepository>>;
    listBranches(access: GitHostAccess, repositoryId: string, { offset, limit, search }: GitHostDiscoveryQuery): Promise<GitHostPage<PromotionBranch>>;
    private get;
}
