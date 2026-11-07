import type { Response } from 'express';
export type WebhookNodeResponseHeaders = {
    entries?: Array<{
        name: string;
        value: string;
    }>;
};
export declare class WebhookResponseHeaders {
    private headers;
    static fromObject(obj: object): WebhookResponseHeaders;
    set(name: string, value: string): void;
    addFromObject(obj: object): void;
    addFromNodeHeaders(nodeHeaders: WebhookNodeResponseHeaders): void;
    applyToResponse(res: Response): void;
}
export type WebhookSandboxSetting = 'webhook' | 'form';
export declare function setRouteSandboxSetting(res: Response, setting: WebhookSandboxSetting): void;
export declare function applySandboxCSP(res: Response, fallback?: WebhookSandboxSetting): void;
export declare function applyFormSandboxCSP(res: Response): void;
