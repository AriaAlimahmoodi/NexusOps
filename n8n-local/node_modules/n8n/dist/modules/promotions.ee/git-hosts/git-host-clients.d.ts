import type { PromotionGitHostType } from '@n8n/api-types';
import type { GitHostClient } from './git-host.types';
import { GitLabHostClient } from './gitlab-host.client';
export declare class GitHostClients {
    private readonly clients;
    constructor(gitlab: GitLabHostClient);
    clientFor(type: PromotionGitHostType): GitHostClient;
}
