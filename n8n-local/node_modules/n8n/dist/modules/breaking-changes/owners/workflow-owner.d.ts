import type { BreakingChangeWorkflowOwner, MigrationOwnerSource } from '@n8n/api-types';
import type { User } from '@n8n/db';
export declare function toWorkflowOwner(user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>, source: MigrationOwnerSource): BreakingChangeWorkflowOwner;
export declare function canOwnFindings(user: Pick<User, 'disabled' | 'isPending'>): boolean;
