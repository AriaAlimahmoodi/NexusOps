import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class MigrateExternalSecretsToEntityStorage1771500000000 implements IrreversibleMigration {
    private readonly cipher;
    up(context: MigrationContext): Promise<void>;
    private readSettings;
    private migrateProvider;
}
