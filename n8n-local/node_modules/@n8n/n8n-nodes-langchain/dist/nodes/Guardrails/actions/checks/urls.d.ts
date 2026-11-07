import type { CreateCheckFn, GuardrailResult } from '../types';
export type UrlsConfig = {
    allowedUrls: string[];
    allowedSchemes: string[];
    blockUserinfo: boolean;
    allowSubdomains: boolean;
};
export declare const urls: (data: string, config: UrlsConfig) => GuardrailResult;
export declare const createUrlsCheckFn: CreateCheckFn<UrlsConfig>;
