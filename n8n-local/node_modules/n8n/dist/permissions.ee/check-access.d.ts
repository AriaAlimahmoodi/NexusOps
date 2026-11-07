import type { User, EntityManager } from '@n8n/db';
import { type Scope } from '@n8n/permissions';
export declare function userHasScopes(user: User, scopes: Scope[], globalOnly: boolean, { credentialId, workflowId, projectId, dataTableId, }: {
    credentialId?: string;
    workflowId?: string;
    projectId?: string;
    dataTableId?: string;
}, entityManager?: EntityManager): Promise<boolean>;
