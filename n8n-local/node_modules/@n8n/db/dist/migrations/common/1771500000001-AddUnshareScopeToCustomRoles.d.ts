import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddUnshareScopeToCustomRoles1771500000001 implements ReversibleMigration {
    up({ escape, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
