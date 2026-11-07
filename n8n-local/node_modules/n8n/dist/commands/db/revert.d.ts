import { Logger } from '@n8n/backend-common';
import { MigrationExecutor, DataSource as Connection } from '@n8n/typeorm';
export declare function main(logger: Logger, connection: Connection, migrationExecutor: MigrationExecutor): Promise<void>;
export declare class DbRevertMigrationCommand {
    private readonly logger;
    private connection;
    constructor(logger: Logger);
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
    protected finally(error: Error | undefined): Promise<void>;
}
