import { UserError } from '@n8n/errors';
export declare class UnsupportedEndUserCredentialTriggerError extends UserError {
    constructor(resolverType: 'system' | 'custom');
}
