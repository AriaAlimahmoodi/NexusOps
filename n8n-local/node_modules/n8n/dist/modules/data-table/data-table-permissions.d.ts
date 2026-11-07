import type { InstanceWriteAccessService } from '@n8n/backend-services';
import type { User } from '@n8n/db';
export declare function assertSchemaWriteAccess(instanceWriteAccess: InstanceWriteAccessService): void;
export declare function assertRowReadAccessIfReturningRows(user: User, dataTableId: string, { dryRun, returnData }: {
    dryRun?: boolean;
    returnData?: boolean;
}): Promise<void>;
