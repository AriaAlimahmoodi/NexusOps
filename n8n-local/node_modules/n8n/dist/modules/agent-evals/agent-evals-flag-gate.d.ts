import type { User } from '@n8n/db';
import { PostHogClient } from '../../posthog';
export declare class AgentEvalsFlagGate {
    private readonly postHogClient;
    constructor(postHogClient: PostHogClient);
    isEnabled(user: User): Promise<boolean>;
    assertEnabled(user: User): Promise<void>;
}
