import type { IConnections, INode, IWorkflowBase, IWorkflowGroup, IWorkflowSettings } from 'n8n-workflow';
import { z } from 'zod';
export declare const workflowSettingsObjectSchema: z.ZodObject<{
    errorWorkflow: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    executionOrder: z.ZodOptional<z.ZodEnum<["v0", "v1"]>>;
    saveExecutionProgress: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"DEFAULT">]>>;
    saveManualExecutions: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"DEFAULT">]>>;
    saveDataErrorExecution: z.ZodOptional<z.ZodEnum<["DEFAULT", "all", "none"]>>;
    saveDataSuccessExecution: z.ZodOptional<z.ZodEnum<["DEFAULT", "all", "none"]>>;
    executionTimeout: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
    timeSavedPerExecution: z.ZodOptional<z.ZodNumber>;
    callerPolicy: z.ZodOptional<z.ZodEnum<["any", "none", "workflowsFromAList", "workflowsFromSameOwner"]>>;
    callerIds: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    errorWorkflow?: string | undefined;
    timezone?: string | undefined;
    executionOrder?: "v0" | "v1" | undefined;
    saveExecutionProgress?: "DEFAULT" | boolean | undefined;
    saveManualExecutions?: "DEFAULT" | boolean | undefined;
    saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
    saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
    executionTimeout?: number | undefined;
    timeSavedPerExecution?: number | undefined;
    callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
    callerIds?: string | undefined;
}, {
    errorWorkflow?: string | undefined;
    timezone?: string | undefined;
    executionOrder?: "v0" | "v1" | undefined;
    saveExecutionProgress?: "DEFAULT" | boolean | undefined;
    saveManualExecutions?: "DEFAULT" | boolean | undefined;
    saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
    saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
    executionTimeout?: number | undefined;
    timeSavedPerExecution?: number | undefined;
    callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
    callerIds?: string | undefined;
}>;
export declare const workflowSettingsInputSchema: z.ZodEffects<z.ZodObject<{
    errorWorkflow: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    executionOrder: z.ZodOptional<z.ZodEnum<["v0", "v1"]>>;
    saveExecutionProgress: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"DEFAULT">]>>;
    saveManualExecutions: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"DEFAULT">]>>;
    saveDataErrorExecution: z.ZodOptional<z.ZodEnum<["DEFAULT", "all", "none"]>>;
    saveDataSuccessExecution: z.ZodOptional<z.ZodEnum<["DEFAULT", "all", "none"]>>;
    executionTimeout: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
    timeSavedPerExecution: z.ZodOptional<z.ZodNumber>;
    callerPolicy: z.ZodOptional<z.ZodEnum<["any", "none", "workflowsFromAList", "workflowsFromSameOwner"]>>;
    callerIds: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    errorWorkflow?: string | undefined;
    timezone?: string | undefined;
    executionOrder?: "v0" | "v1" | undefined;
    saveExecutionProgress?: "DEFAULT" | boolean | undefined;
    saveManualExecutions?: "DEFAULT" | boolean | undefined;
    saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
    saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
    executionTimeout?: number | undefined;
    timeSavedPerExecution?: number | undefined;
    callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
    callerIds?: string | undefined;
}, {
    errorWorkflow?: string | undefined;
    timezone?: string | undefined;
    executionOrder?: "v0" | "v1" | undefined;
    saveExecutionProgress?: "DEFAULT" | boolean | undefined;
    saveManualExecutions?: "DEFAULT" | boolean | undefined;
    saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
    saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
    executionTimeout?: number | undefined;
    timeSavedPerExecution?: number | undefined;
    callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
    callerIds?: string | undefined;
}>, {
    errorWorkflow?: string | undefined;
    timezone?: string | undefined;
    executionOrder?: "v0" | "v1" | undefined;
    saveExecutionProgress?: "DEFAULT" | boolean | undefined;
    saveManualExecutions?: "DEFAULT" | boolean | undefined;
    saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
    saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
    executionTimeout?: number | undefined;
    timeSavedPerExecution?: number | undefined;
    callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
    callerIds?: string | undefined;
}, {
    errorWorkflow?: string | undefined;
    timezone?: string | undefined;
    executionOrder?: "v0" | "v1" | undefined;
    saveExecutionProgress?: "DEFAULT" | boolean | undefined;
    saveManualExecutions?: "DEFAULT" | boolean | undefined;
    saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
    saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
    executionTimeout?: number | undefined;
    timeSavedPerExecution?: number | undefined;
    callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
    callerIds?: string | undefined;
}>;
export declare const partialUpdateOperationSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"updateNodeParameters">;
    nodeName: z.ZodString;
    parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    replace: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "updateNodeParameters";
    nodeName: string;
    parameters: Record<string, unknown>;
    replace?: boolean | undefined;
}, {
    type: "updateNodeParameters";
    nodeName: string;
    parameters: Record<string, unknown>;
    replace?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"setNodeParameter">;
    nodeName: z.ZodString;
    path: z.ZodString;
    value: z.ZodEffects<z.ZodUnknown, {} | null, unknown>;
}, "strip", z.ZodTypeAny, {
    type: "setNodeParameter";
    nodeName: string;
    path: string;
    value: {} | null;
}, {
    type: "setNodeParameter";
    nodeName: string;
    path: string;
    value?: unknown;
}>, z.ZodObject<{
    type: z.ZodLiteral<"addNode">;
    node: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        typeVersion: z.ZodNumber;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        position: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodNumber, "many">, [number, number], number[]>>;
        credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id?: string | undefined;
            name: string;
        }, {
            id?: string | undefined;
            name: string;
        }>>>;
        disabled: z.ZodOptional<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        typeVersion: number;
        parameters?: Record<string, unknown> | undefined;
        position?: [number, number] | undefined;
        credentials?: Record<string, {
            id?: string | undefined;
            name: string;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        id?: string | undefined;
    }, {
        name: string;
        type: string;
        typeVersion: number;
        parameters?: Record<string, unknown> | undefined;
        position?: number[] | undefined;
        credentials?: Record<string, {
            id?: string | undefined;
            name: string;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        id?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "addNode";
    node: {
        name: string;
        type: string;
        typeVersion: number;
        parameters?: Record<string, unknown> | undefined;
        position?: [number, number] | undefined;
        credentials?: Record<string, {
            id?: string | undefined;
            name: string;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        id?: string | undefined;
    };
}, {
    type: "addNode";
    node: {
        name: string;
        type: string;
        typeVersion: number;
        parameters?: Record<string, unknown> | undefined;
        position?: number[] | undefined;
        credentials?: Record<string, {
            id?: string | undefined;
            name: string;
        }> | undefined;
        disabled?: boolean | undefined;
        notes?: string | undefined;
        id?: string | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"removeNode">;
    nodeName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "removeNode";
    nodeName: string;
}, {
    type: "removeNode";
    nodeName: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"renameNode">;
    oldName: z.ZodString;
    newName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "renameNode";
    oldName: string;
    newName: string;
}, {
    type: "renameNode";
    oldName: string;
    newName: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"addConnection">;
    source: z.ZodString;
    target: z.ZodString;
    sourceIndex: z.ZodOptional<z.ZodNumber>;
    targetIndex: z.ZodOptional<z.ZodNumber>;
    connectionType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "addConnection";
    source: string;
    target: string;
    sourceIndex?: number | undefined;
    targetIndex?: number | undefined;
    connectionType?: string | undefined;
}, {
    type: "addConnection";
    source: string;
    target: string;
    sourceIndex?: number | undefined;
    targetIndex?: number | undefined;
    connectionType?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"removeConnection">;
    source: z.ZodString;
    target: z.ZodString;
    sourceIndex: z.ZodOptional<z.ZodNumber>;
    targetIndex: z.ZodOptional<z.ZodNumber>;
    connectionType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "removeConnection";
    source: string;
    target: string;
    sourceIndex?: number | undefined;
    targetIndex?: number | undefined;
    connectionType?: string | undefined;
}, {
    type: "removeConnection";
    source: string;
    target: string;
    sourceIndex?: number | undefined;
    targetIndex?: number | undefined;
    connectionType?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"setNodeCredential">;
    nodeName: z.ZodString;
    credentialKey: z.ZodString;
    credentialId: z.ZodString;
    credentialName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "setNodeCredential";
    nodeName: string;
    credentialKey: string;
    credentialId: string;
    credentialName: string;
}, {
    type: "setNodeCredential";
    nodeName: string;
    credentialKey: string;
    credentialId: string;
    credentialName: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"setNodePosition">;
    nodeName: z.ZodString;
    position: z.ZodEffects<z.ZodArray<z.ZodNumber, "many">, [number, number], number[]>;
}, "strip", z.ZodTypeAny, {
    type: "setNodePosition";
    nodeName: string;
    position: [number, number];
}, {
    type: "setNodePosition";
    nodeName: string;
    position: number[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"setNodeDisabled">;
    nodeName: z.ZodString;
    disabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type: "setNodeDisabled";
    nodeName: string;
    disabled: boolean;
}, {
    type: "setNodeDisabled";
    nodeName: string;
    disabled: boolean;
}>, z.ZodObject<{
    type: z.ZodLiteral<"setNodeSettings">;
    nodeName: z.ZodString;
    settings: z.ZodEffects<z.ZodObject<{
        onError: z.ZodOptional<z.ZodEnum<["stopWorkflow", "continueRegularOutput", "continueErrorOutput"]>>;
        retryOnFail: z.ZodOptional<z.ZodBoolean>;
        maxTries: z.ZodOptional<z.ZodNumber>;
        waitBetweenTries: z.ZodOptional<z.ZodNumber>;
        alwaysOutputData: z.ZodOptional<z.ZodBoolean>;
        executeOnce: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        onError?: "continueErrorOutput" | "continueRegularOutput" | "stopWorkflow" | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
    }, {
        onError?: "continueErrorOutput" | "continueRegularOutput" | "stopWorkflow" | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
    }>, {
        onError?: "continueErrorOutput" | "continueRegularOutput" | "stopWorkflow" | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
    }, {
        onError?: "continueErrorOutput" | "continueRegularOutput" | "stopWorkflow" | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "setNodeSettings";
    nodeName: string;
    settings: {
        onError?: "continueErrorOutput" | "continueRegularOutput" | "stopWorkflow" | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
    };
}, {
    type: "setNodeSettings";
    nodeName: string;
    settings: {
        onError?: "continueErrorOutput" | "continueRegularOutput" | "stopWorkflow" | undefined;
        retryOnFail?: boolean | undefined;
        maxTries?: number | undefined;
        waitBetweenTries?: number | undefined;
        alwaysOutputData?: boolean | undefined;
        executeOnce?: boolean | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"setWorkflowMetadata">;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "setWorkflowMetadata";
    name?: string | undefined;
    description?: string | undefined;
}, {
    type: "setWorkflowMetadata";
    name?: string | undefined;
    description?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"setWorkflowSettings">;
    settings: z.ZodEffects<z.ZodObject<{
        errorWorkflow: z.ZodOptional<z.ZodString>;
        timezone: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        executionOrder: z.ZodOptional<z.ZodEnum<["v0", "v1"]>>;
        saveExecutionProgress: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"DEFAULT">]>>;
        saveManualExecutions: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"DEFAULT">]>>;
        saveDataErrorExecution: z.ZodOptional<z.ZodEnum<["DEFAULT", "all", "none"]>>;
        saveDataSuccessExecution: z.ZodOptional<z.ZodEnum<["DEFAULT", "all", "none"]>>;
        executionTimeout: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
        timeSavedPerExecution: z.ZodOptional<z.ZodNumber>;
        callerPolicy: z.ZodOptional<z.ZodEnum<["any", "none", "workflowsFromAList", "workflowsFromSameOwner"]>>;
        callerIds: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        errorWorkflow?: string | undefined;
        timezone?: string | undefined;
        executionOrder?: "v0" | "v1" | undefined;
        saveExecutionProgress?: "DEFAULT" | boolean | undefined;
        saveManualExecutions?: "DEFAULT" | boolean | undefined;
        saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
        saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timeSavedPerExecution?: number | undefined;
        callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
        callerIds?: string | undefined;
    }, {
        errorWorkflow?: string | undefined;
        timezone?: string | undefined;
        executionOrder?: "v0" | "v1" | undefined;
        saveExecutionProgress?: "DEFAULT" | boolean | undefined;
        saveManualExecutions?: "DEFAULT" | boolean | undefined;
        saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
        saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timeSavedPerExecution?: number | undefined;
        callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
        callerIds?: string | undefined;
    }>, {
        errorWorkflow?: string | undefined;
        timezone?: string | undefined;
        executionOrder?: "v0" | "v1" | undefined;
        saveExecutionProgress?: "DEFAULT" | boolean | undefined;
        saveManualExecutions?: "DEFAULT" | boolean | undefined;
        saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
        saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timeSavedPerExecution?: number | undefined;
        callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
        callerIds?: string | undefined;
    }, {
        errorWorkflow?: string | undefined;
        timezone?: string | undefined;
        executionOrder?: "v0" | "v1" | undefined;
        saveExecutionProgress?: "DEFAULT" | boolean | undefined;
        saveManualExecutions?: "DEFAULT" | boolean | undefined;
        saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
        saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timeSavedPerExecution?: number | undefined;
        callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
        callerIds?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "setWorkflowSettings";
    settings: {
        errorWorkflow?: string | undefined;
        timezone?: string | undefined;
        executionOrder?: "v0" | "v1" | undefined;
        saveExecutionProgress?: "DEFAULT" | boolean | undefined;
        saveManualExecutions?: "DEFAULT" | boolean | undefined;
        saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
        saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timeSavedPerExecution?: number | undefined;
        callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
        callerIds?: string | undefined;
    };
}, {
    type: "setWorkflowSettings";
    settings: {
        errorWorkflow?: string | undefined;
        timezone?: string | undefined;
        executionOrder?: "v0" | "v1" | undefined;
        saveExecutionProgress?: "DEFAULT" | boolean | undefined;
        saveManualExecutions?: "DEFAULT" | boolean | undefined;
        saveDataErrorExecution?: "DEFAULT" | "all" | "none" | undefined;
        saveDataSuccessExecution?: "DEFAULT" | "all" | "none" | undefined;
        executionTimeout?: number | undefined;
        timeSavedPerExecution?: number | undefined;
        callerPolicy?: "any" | "none" | "workflowsFromAList" | "workflowsFromSameOwner" | undefined;
        callerIds?: string | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"addTags">;
    names: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "addTags";
    names: string[];
}, {
    type: "addTags";
    names: string[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"removeTags">;
    names: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "removeTags";
    names: string[];
}, {
    type: "removeTags";
    names: string[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"setNodeGroups">;
    nodeGroups: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        nodeNames: z.ZodArray<z.ZodString, "many">;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string | undefined;
        name: string;
        nodeNames: string[];
        description?: string | undefined;
    }, {
        id?: string | undefined;
        name: string;
        nodeNames: string[];
        description?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "setNodeGroups";
    nodeGroups: {
        id?: string | undefined;
        name: string;
        nodeNames: string[];
        description?: string | undefined;
    }[];
}, {
    type: "setNodeGroups";
    nodeGroups: {
        id?: string | undefined;
        name: string;
        nodeNames: string[];
        description?: string | undefined;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"addNodeGroup">;
    name: z.ZodString;
    nodeNames: z.ZodArray<z.ZodString, "many">;
    description: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "addNodeGroup";
    name: string;
    nodeNames: string[];
    description?: string | undefined;
    id?: string | undefined;
}, {
    type: "addNodeGroup";
    name: string;
    nodeNames: string[];
    description?: string | undefined;
    id?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"removeNodeGroup">;
    groupName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "removeNodeGroup";
    groupName: string;
}, {
    type: "removeNodeGroup";
    groupName: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"updateNodeGroup">;
    groupName: z.ZodString;
    newName: z.ZodOptional<z.ZodString>;
    nodeNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "updateNodeGroup";
    groupName: string;
    newName?: string | undefined;
    nodeNames?: string[] | undefined;
    description?: string | undefined;
}, {
    type: "updateNodeGroup";
    groupName: string;
    newName?: string | undefined;
    nodeNames?: string[] | undefined;
    description?: string | undefined;
}>]>;
export type PartialUpdateOperation = z.infer<typeof partialUpdateOperationSchema>;
export declare const NON_FATAL_OPERATION_TYPES: ReadonlySet<PartialUpdateOperation['type']>;
interface WorkflowSlice {
    name: string;
    description?: string;
    nodes: INode[];
    connections: IConnections;
    settings?: IWorkflowSettings;
    nodeGroups?: IWorkflowGroup[];
    tagNames?: string[];
}
export interface SkippedOperation {
    opIndex: number;
    type: PartialUpdateOperation['type'];
    reason: string;
}
export interface GroupOperationRef {
    opIndex: number;
    type: PartialUpdateOperation['type'];
}
export interface ApplyOperationsSuccess {
    success: true;
    workflow: WorkflowSlice;
    addedNodeNames: string[];
    tagNames?: string[];
    nodeGroupsChanged: boolean;
    skippedOperations: SkippedOperation[];
    groupOperations: Record<string, GroupOperationRef>;
}
export interface ApplyOperationsFailure {
    success: false;
    error: string;
    opIndex: number;
}
export type ApplyOperationsResult = ApplyOperationsSuccess | ApplyOperationsFailure;
export declare function applyOperations(input: WorkflowSlice, operations: PartialUpdateOperation[]): ApplyOperationsResult;
export declare function toWorkflowSlice(workflow: IWorkflowBase, options?: {
    includeTags?: boolean;
}): WorkflowSlice;
export {};
