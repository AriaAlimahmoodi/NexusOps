import { GlobalConfig } from '@n8n/config';
import type { Request, Response } from 'express';
export declare const OAUTH_BINDING_COOKIE_NAME = "n8n-oauth-binding";
export type BindingVerifyResult = {
    ok: true;
} | {
    ok: false;
    reason: 'cookie-missing' | 'hash-mismatch';
};
export declare class OAuthBrowserBindingService {
    private readonly globalConfig;
    constructor(globalConfig: GlobalConfig);
    isEnabled(): boolean;
    ensureBindingCookie(req: Request, res: Response): string;
    computeHash(nonce: string): string;
    verifyBinding(req: Request, expectedHash: string): BindingVerifyResult;
    private readCookie;
}
