import type { User } from '@n8n/db';
import { type Role as RoleDTO, type RoleNamespace } from '@n8n/permissions';
export declare function assertCanManageRoleType({ apiKeyScopes, roleType, user, }: {
    apiKeyScopes?: readonly string[];
    roleType: RoleNamespace;
    user: User;
}): void;
export declare function canReassignUsers({ apiKeyScopes, role, user, }: {
    apiKeyScopes?: readonly string[];
    role: RoleDTO;
    user: User;
}): boolean;
