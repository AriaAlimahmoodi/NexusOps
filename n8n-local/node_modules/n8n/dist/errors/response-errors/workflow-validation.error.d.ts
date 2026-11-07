import { WorkflowActivationBadRequestError } from './workflow-activation-bad-request.error';
export declare class WorkflowValidationError extends WorkflowActivationBadRequestError {
    readonly meta: {
        validationError: true;
    };
    constructor(message: string);
}
