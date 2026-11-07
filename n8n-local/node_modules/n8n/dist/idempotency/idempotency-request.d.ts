import type { IncomingMessage } from 'node:http';
type FingerprintRequest = {
    method?: string;
    url?: string;
    originalUrl?: string;
    body?: unknown;
    files?: unknown;
    rawBody?: Buffer;
    encoding?: BufferEncoding;
};
export type ParsedIdempotencyKey = {
    kind: 'absent';
} | {
    kind: 'invalid';
} | {
    kind: 'present';
    value: string;
};
export declare function rememberRawBody(req: IncomingMessage, body: Buffer): void;
export declare function parseIdempotencyKey(header: string | string[] | undefined): ParsedIdempotencyKey;
export declare function honorsIdempotencyKey(method: string, path: string): boolean;
export declare function fingerprintParts(parts: {
    method: string;
    path: string;
    query: string;
    body: string;
}): string;
export declare function requestFingerprint(req: FingerprintRequest): string;
export {};
