import { OperationalError, UnexpectedError } from 'n8n-workflow';
import type { OperationalErrorOptions, UnexpectedErrorOptions } from 'n8n-workflow';
export declare abstract class AiWorkflowBuilderError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
export declare class NodeNotFoundError extends OperationalError {
    constructor(nodeId: string, nodeType?: string, options?: OperationalErrorOptions);
}
export declare class NodeTypeNotFoundError extends OperationalError {
    constructor(nodeType: string, options?: OperationalErrorOptions);
}
export declare class ConnectionError extends OperationalError {
    constructor(message: string, options?: OperationalErrorOptions & {
        fromNodeId?: string;
        toNodeId?: string;
        connectionType?: string;
    });
}
export declare class LLMServiceError extends OperationalError {
    constructor(message: string, options?: OperationalErrorOptions & {
        llmModel?: string;
        statusCode?: number;
    });
}
export declare class ValidationError extends OperationalError {
    constructor(message: string, options?: OperationalErrorOptions & {
        field?: string;
        value?: unknown;
    });
}
export declare class ParameterUpdateError extends OperationalError {
    constructor(message: string, options?: OperationalErrorOptions & {
        nodeId?: string;
        nodeType: string;
        parameter?: string;
    });
}
export declare class ParameterTooLargeError extends OperationalError {
    constructor(message: string, options?: OperationalErrorOptions & {
        nodeId?: string;
        parameter?: string;
        maxSize?: number;
    });
}
export declare class WorkflowStateError extends UnexpectedError {
    constructor(message: string, options?: UnexpectedErrorOptions);
}
export declare class ToolExecutionError extends UnexpectedError {
    constructor(message: string, options?: UnexpectedErrorOptions & {
        toolName?: string;
    });
}
