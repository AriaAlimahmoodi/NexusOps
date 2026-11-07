export declare function threadMemoryResourceId(threadId: string): string;
export declare function episodicMemoryWriteScopeId(scope: {
    resourceId: string;
    threadId: string;
}): string;
export declare function draftChatMemoryResourceId(userId: string): string;
export declare function productionChatMemoryResourceId(userId: string): string;
export declare function systemChatMemoryResourceId(userId: string): string;
export declare function userIdFromSystemChatMemoryResourceId(resourceId: string): string | undefined;
export declare function userIdFromProductionChatMemoryResourceId(resourceId: string): string | undefined;
export declare function userIdFromDraftChatMemoryResourceId(resourceId: string): string | undefined;
export declare function integrationTypeFromMemoryResourceId(resourceId: string): string | undefined;
export declare function integrationMemoryResourceId(integrationType: string, platformUserId: string): string;
export declare function isIntegrationMemoryResourceId(resourceId: string | undefined): resourceId is string;
export declare function taskRunMemoryResourceId(taskId: string): string;
export declare function isTaskRunMemoryResourceId(resourceId: string | undefined): resourceId is string;
