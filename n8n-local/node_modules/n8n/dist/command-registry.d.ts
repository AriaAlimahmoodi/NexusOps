import { CliParser, Logger, ModuleRegistry } from '@n8n/backend-common';
import { CommandMetadata, type CommandEntry } from '@n8n/decorators';
import './zod-alias-support';
export declare class CommandRegistry {
    private readonly commandMetadata;
    private readonly moduleRegistry;
    private readonly logger;
    private readonly cliParser;
    private commandName;
    constructor(commandMetadata: CommandMetadata, moduleRegistry: ModuleRegistry, logger: Logger, cliParser: CliParser);
    execute(): Promise<undefined>;
    listAllCommands(): Promise<void>;
    printCommandUsage(commandEntry: CommandEntry): void;
    private formatZodError;
}
