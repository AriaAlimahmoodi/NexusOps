import { AuthenticatedRequest } from '@n8n/db';
import { StaticRouterMetadata } from '@n8n/decorators';
import type { ClientRequest } from 'node:http';
export declare function maskIp(ip: string): string;
export declare function setPostHogProxyHeaders(proxyReq: ClientRequest, req: AuthenticatedRequest & {
    rawBody?: Buffer;
}): void;
export declare class PostHogController {
    static routers: StaticRouterMetadata[];
}
