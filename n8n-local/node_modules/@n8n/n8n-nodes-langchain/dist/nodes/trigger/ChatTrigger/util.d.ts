import type { ChatNodeMessage, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
export declare function configureWaitTillDate(context: IExecuteFunctions): Date;
export declare const configureInputs: (parameters: {
    options?: {
        memoryConnection?: boolean;
    };
}) => ({
    type: string;
} | {
    type: string;
    displayName: string;
    maxConnections: number;
})[];
export declare const getSendAndWaitPropertiesForChatNode: () => INodeProperties[];
export declare function getChatMessage(ctx: IExecuteFunctions): ChatNodeMessage;
