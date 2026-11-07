import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class ConvertAgentIdToUuid1765804780000 implements ReversibleMigration {
    up({ runQuery, escape }: MigrationContext): Promise<void>;
    down({ runQuery, escape }: MigrationContext): Promise<void>;
}
