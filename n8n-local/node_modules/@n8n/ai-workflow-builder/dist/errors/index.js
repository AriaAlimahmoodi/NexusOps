"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutionError = exports.WorkflowStateError = exports.ParameterTooLargeError = exports.ParameterUpdateError = exports.ValidationError = exports.LLMServiceError = exports.ConnectionError = exports.NodeTypeNotFoundError = exports.NodeNotFoundError = exports.AiWorkflowBuilderError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class AiWorkflowBuilderError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
    }
}
exports.AiWorkflowBuilderError = AiWorkflowBuilderError;
class NodeNotFoundError extends n8n_workflow_1.OperationalError {
    constructor(nodeId, nodeType, options) {
        super(`Node with ID "${nodeId}" not found in workflow`, {
            ...options,
            tags: {
                ...options?.tags,
                nodeId,
                nodeType,
            },
            shouldReport: false,
        });
    }
}
exports.NodeNotFoundError = NodeNotFoundError;
class NodeTypeNotFoundError extends n8n_workflow_1.OperationalError {
    constructor(nodeType, options) {
        super(`Node type "${nodeType}" not found`, {
            ...options,
            tags: {
                ...options?.tags,
                nodeType,
            },
            shouldReport: false,
        });
    }
}
exports.NodeTypeNotFoundError = NodeTypeNotFoundError;
class ConnectionError extends n8n_workflow_1.OperationalError {
    constructor(message, options) {
        super(message, {
            ...options,
            tags: {
                ...options?.tags,
                fromNodeId: options?.fromNodeId,
                toNodeId: options?.toNodeId,
                connectionType: options?.connectionType,
            },
            shouldReport: false,
        });
    }
}
exports.ConnectionError = ConnectionError;
class LLMServiceError extends n8n_workflow_1.OperationalError {
    constructor(message, options) {
        super(message, {
            ...options,
            tags: {
                ...options?.tags,
                llmModel: options?.llmModel,
                statusCode: options?.statusCode,
            },
            shouldReport: true,
        });
    }
}
exports.LLMServiceError = LLMServiceError;
class ValidationError extends n8n_workflow_1.OperationalError {
    constructor(message, options) {
        super(message, {
            ...options,
            tags: {
                ...options?.tags,
                field: options?.field,
            },
            extra: {
                ...options?.extra,
                value: options?.value,
            },
            shouldReport: false,
        });
    }
}
exports.ValidationError = ValidationError;
class ParameterUpdateError extends n8n_workflow_1.OperationalError {
    constructor(message, options) {
        super(message, {
            ...options,
            tags: {
                ...options?.tags,
                nodeId: options?.nodeId,
                nodeType: options?.nodeType,
                parameter: options?.parameter,
            },
            shouldReport: false,
        });
    }
}
exports.ParameterUpdateError = ParameterUpdateError;
class ParameterTooLargeError extends n8n_workflow_1.OperationalError {
    constructor(message, options) {
        super(message, {
            ...options,
            tags: {
                ...options?.tags,
                nodeId: options?.nodeId,
                parameter: options?.parameter,
                maxSize: options?.maxSize,
            },
            shouldReport: false,
        });
    }
}
exports.ParameterTooLargeError = ParameterTooLargeError;
class WorkflowStateError extends n8n_workflow_1.UnexpectedError {
    constructor(message, options) {
        super(message, {
            ...options,
            shouldReport: true,
        });
    }
}
exports.WorkflowStateError = WorkflowStateError;
class ToolExecutionError extends n8n_workflow_1.UnexpectedError {
    constructor(message, options) {
        super(message, {
            ...options,
            shouldReport: true,
            tags: {
                ...options?.tags,
                toolName: options?.toolName,
            },
        });
    }
}
exports.ToolExecutionError = ToolExecutionError;
//# sourceMappingURL=index.js.map