import type { User } from '@n8n/db';
import type { NodeGroupRuleOptions } from 'n8n-workflow';
import { PostHogClient } from '../posthog';
export declare class NodeGroupRulesFlagGate {
    private readonly postHogClient;
    constructor(postHogClient: PostHogClient);
    getEnabledRules(user: User): Promise<Required<NodeGroupRuleOptions>>;
}
