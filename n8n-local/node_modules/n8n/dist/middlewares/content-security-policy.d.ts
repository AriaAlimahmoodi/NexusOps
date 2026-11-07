import type { RequestHandler } from 'express';
import type { ContentSecurityPolicies } from '../security/content-security-policy';
declare global {
    namespace Express {
        interface Locals {
            cspNonce: string;
        }
    }
}
export declare const createContentSecurityPolicyMiddleware: ({ enforced, reportOnly, }: ContentSecurityPolicies) => RequestHandler;
