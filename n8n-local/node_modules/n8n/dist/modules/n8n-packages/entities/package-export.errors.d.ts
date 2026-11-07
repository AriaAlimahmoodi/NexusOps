import { UserError } from 'n8n-workflow';
export declare class PackageEntityAccessDeniedError extends UserError {
}
export declare class PackageEntityNotFoundError extends UserError {
}
export declare class PackageExportBlockedError extends UserError {
}
export declare function assertEveryRequestedEntityAccessible(entityType: string, requestedIds: string[], accessibleEntities: ReadonlyArray<{
    id: string;
}>, findExistingIdsWithoutAccessCheck: (ids: string[]) => Promise<Set<string>>): Promise<void>;
