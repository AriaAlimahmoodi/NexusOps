import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
export interface GraphResponse {
    statusCode: number;
    body: unknown;
    ok: boolean;
}
export declare class TeamsGraphService {
    private readonly outboundHttp;
    private readonly logger;
    constructor(outboundHttp: OutboundHttp, logger: Logger);
    request(accessToken: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown, headers?: Record<string, string>): Promise<GraphResponse>;
    postZip(accessToken: string, path: string, archive: Buffer): Promise<GraphResponse>;
}
export declare const odataLiteral: (value: string) => string;
export declare function graphErrorCode(body: unknown): string | undefined;
export declare function graphErrorMessage(body: unknown): string | undefined;
export declare function graphInnerErrorCode(body: unknown): string | undefined;
export declare function describeGraphError(body: unknown): string | undefined;
