import { PostHogClient } from '../posthog';
export declare class CredentialDescriptionsService {
    private readonly postHogClient;
    constructor(postHogClient: PostHogClient);
    isEnabled(): Promise<boolean>;
    stripIfDisabled<T extends {
        description?: unknown;
    }>(credentials: T | T[]): Promise<void>;
}
