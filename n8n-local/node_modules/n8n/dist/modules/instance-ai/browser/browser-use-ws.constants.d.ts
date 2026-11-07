import type { Request } from 'express';
import type { WebSocket } from 'ws';
export declare const BROWSER_USE_WS_NAMESPACE = "/browser-use";
export declare const CDP_TOKEN_HEADER = "x-n8n-cdp-token";
export declare const EXTENSION_VERSION_QUERY_PARAM = "extensionVersion";
export declare function parseExtensionVersion(value: unknown): string | null;
export interface BrowserUseUpgradeRequest extends Request {
    ws: WebSocket;
}
