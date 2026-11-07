import { Logger } from '@n8n/backend-common';
import { AgentsConfig } from '@n8n/config';
export declare class SkillsHubRollout {
    private readonly agentsConfig;
    private readonly logger;
    private enabled;
    constructor(agentsConfig: AgentsConfig, logger: Logger);
    init(): void;
    get isEnabled(): boolean;
}
