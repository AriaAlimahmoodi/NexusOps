import type { CreateSlackAgentAppResponse, SlackAgentAppManifestResponse } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { UserRepository } from '@n8n/db';
import { CacheService } from '@n8n/backend-services';
import { ProjectService } from '../../../../../services/project.service.ee';
import { SlackMethodsService } from './slack-methods.service';
export interface CreateSlackAppOptions {
    projectId: string;
    agentId: string;
    appConfigurationToken: string;
    user: User;
}
export interface GetSlackAppManifestOptions {
    projectId: string;
    agentId: string;
}
export interface CompleteSlackAppInstallOptions {
    projectId: string;
    agentId: string;
    code: string;
    state: string;
}
export declare class SlackManualSetupService {
    private readonly methods;
    private readonly userRepository;
    private readonly cacheService;
    private readonly projectService;
    constructor(methods: SlackMethodsService, userRepository: UserRepository, cacheService: CacheService, projectService: ProjectService);
    createApp(options: CreateSlackAppOptions): Promise<CreateSlackAgentAppResponse>;
    getManifest(options: GetSlackAppManifestOptions): Promise<SlackAgentAppManifestResponse>;
    completeInstall(options: CompleteSlackAppInstallOptions): Promise<void>;
    private consumeSession;
    private createInstallSession;
    private getInstallUser;
    private exchangeInstallCode;
}
