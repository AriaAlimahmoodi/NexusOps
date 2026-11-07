import type { Logger } from '@n8n/backend-common';
import type { ContentSecurityPolicyReportOnlySetting, ContentSecurityPolicySetting } from '@n8n/config';
export type ContentSecurityPolicies = {
    enforced?: string;
    reportOnly?: string;
};
export declare const resolveContentSecurityPolicies: (policy: ContentSecurityPolicySetting, reportOnly: ContentSecurityPolicyReportOnlySetting, logger: Pick<Logger, 'warn'>) => ContentSecurityPolicies;
export declare const renderContentSecurityPolicy: (policy: string, nonce: string) => string;
