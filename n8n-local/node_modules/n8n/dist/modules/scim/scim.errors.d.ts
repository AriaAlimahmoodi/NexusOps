import { UserError } from 'n8n-workflow';
export declare class ScimResourceNotFoundError extends UserError {
    constructor(resourceId: string);
}
export declare class ScimConflictError extends UserError {
    constructor(detail: string);
}
export declare class ScimInvalidFilterError extends UserError {
    constructor(filter: string);
}
export declare class ScimInvalidValueError extends UserError {
    constructor(detail: string);
}
