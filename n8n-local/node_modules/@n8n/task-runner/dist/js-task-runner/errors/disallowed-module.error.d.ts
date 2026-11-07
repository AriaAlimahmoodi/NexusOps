import { UserError } from 'n8n-workflow';
export declare class DisallowedModuleError extends UserError {
    constructor(moduleName: string);
}
