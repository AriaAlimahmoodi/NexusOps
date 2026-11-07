import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
export interface ArmResponse {
    statusCode: number;
    body: unknown;
    ok: boolean;
}
export declare function armNextLinkPath(nextLink: string): string | undefined;
export declare class TeamsArmService {
    private readonly outboundHttp;
    private readonly logger;
    constructor(outboundHttp: OutboundHttp, logger: Logger);
    request(accessToken: string, method: 'GET' | 'PUT' | 'POST', path: string, body?: unknown): Promise<ArmResponse>;
}
