import type { User } from '@n8n/db';
import { PostHogClient } from '../../../../posthog';
export declare class N8nChatFlagService {
    private readonly postHogClient;
    constructor(postHogClient: PostHogClient);
    isEnabledFor(user: User): Promise<boolean>;
}
