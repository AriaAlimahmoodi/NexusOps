import { UserError } from 'n8n-workflow';
export declare class SsrfBlockedIpError extends UserError {
    readonly ip: string;
    readonly hostname?: string;
    constructor(ip: string, hostname?: string);
}
