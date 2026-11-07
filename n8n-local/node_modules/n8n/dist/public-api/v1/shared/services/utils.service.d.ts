import { type User } from '@n8n/db';
import type { Scope } from '@n8n/permissions';
export declare function assertProjectScope(user: User, projectId: string, scopes: Scope[]): Promise<void>;
