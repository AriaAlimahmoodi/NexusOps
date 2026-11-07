import { Logger } from '@n8n/backend-common';
import type { RedactableExecution } from '@n8n/backend-services';
import { NodeTypes } from '../../../../node-types';
import type { IExecutionRedactionStrategy, RedactionContext } from '../execution-redaction.interfaces';
export declare class NodeDefinedFieldRedactionStrategy implements IExecutionRedactionStrategy {
    private readonly logger;
    private readonly nodeTypes;
    readonly name = "node-defined-field-redaction";
    constructor(logger: Logger, nodeTypes: NodeTypes);
    requiresRedaction(execution: RedactableExecution, context: RedactionContext): boolean;
    apply(execution: RedactableExecution, context: RedactionContext): Promise<void>;
    private redactTaskDataOutputs;
    private getSensitiveFieldsMap;
    private buildSensitiveFieldsMap;
    private redactAllOutputs;
    private redactFields;
    private isRecord;
    private redactPath;
    private redactPathRecursive;
}
