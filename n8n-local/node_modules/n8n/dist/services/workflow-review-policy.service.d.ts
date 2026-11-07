import { SettingsRepository } from '@n8n/db';
export declare class WorkflowReviewPolicyService {
    private readonly settingsRepository;
    constructor(settingsRepository: SettingsRepository);
    get(): Promise<{
        enabled: boolean;
    }>;
    set(enabled: boolean): Promise<{
        enabled: boolean;
    }>;
}
