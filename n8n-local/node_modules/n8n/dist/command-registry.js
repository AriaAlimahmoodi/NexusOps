"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const picocolors_1 = __importDefault(require("picocolors"));
const zod_1 = require("zod");
require("./zod-alias-support");
const modules_manifest_1 = require("./modules/modules.manifest");
let CommandRegistry = class CommandRegistry {
    constructor(commandMetadata, moduleRegistry, logger, cliParser) {
        this.commandMetadata = commandMetadata;
        this.moduleRegistry = moduleRegistry;
        this.logger = logger;
        this.cliParser = cliParser;
        this.commandName = process.argv[2] ?? 'start';
        this.moduleRegistry.registerPackagedModules(modules_manifest_1.packagedModules);
    }
    async execute() {
        if (this.commandName === '--help' || this.commandName === '-h') {
            await this.listAllCommands();
            return process.exit(0);
        }
        if (this.commandName === 'executeBatch') {
            this.logger.warn('WARNING: "executeBatch" has been renamed to "execute-batch".');
            this.commandName = 'execute-batch';
        }
        const relativeCommandPath = `./commands/${this.commandName.replaceAll(':', '/')}.js`;
        const commandFileExists = await (0, promises_1.access)(node_path_1.default.resolve(__dirname, relativeCommandPath)).then(() => true, () => false);
        if (commandFileExists) {
            try {
                await import(relativeCommandPath);
            }
            catch (error) {
                this.logger.error(picocolors_1.default.red(`Error: Failed to load command "${this.commandName}"`));
                throw error;
            }
        }
        await this.moduleRegistry.loadModules();
        const commandEntry = this.commandMetadata.get(this.commandName);
        if (!commandEntry) {
            this.logger.error(picocolors_1.default.red(`Error: Command "${this.commandName}" not found`));
            return process.exit(1);
        }
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            this.printCommandUsage(commandEntry);
            return process.exit(0);
        }
        let flags;
        try {
            ({ flags } = this.cliParser.parse({
                argv: process.argv,
                flagsSchema: commandEntry.flagsSchema,
            }));
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                this.logger.error(this.formatZodError(error));
                this.logger.info('');
                this.printCommandUsage(commandEntry);
                return process.exit(1);
            }
            throw error;
        }
        const command = di_1.Container.get(commandEntry.class);
        command.flags = flags;
        let error = undefined;
        try {
            await command.init?.();
            await command.run();
        }
        catch (e) {
            error = e;
            await command.catch?.(error);
        }
        finally {
            await command.finally?.(error);
        }
    }
    async listAllCommands() {
        const commandFiles = await (0, fast_glob_1.default)('./commands/**/*.js', {
            ignore: ['**/__tests__/**'],
            cwd: __dirname,
        });
        await Promise.all(commandFiles.map(async (filePath) => await import(filePath)));
        await this.moduleRegistry.loadModules();
        this.logger.info('Available commands:');
        for (const [name, { description }] of this.commandMetadata.getEntries()) {
            this.logger.info(`  ${picocolors_1.default.bold(picocolors_1.default.green(name))}: \n    ${description.split('\n')[0]}`);
        }
        this.logger.info('\nFor more detailed information, visit:\nhttps://docs.n8n.io/hosting/cli-commands/');
    }
    printCommandUsage(commandEntry) {
        const { commandName } = this;
        let output = '';
        output += `${picocolors_1.default.bold('USAGE')}\n`;
        output += `  $ n8n ${commandName}\n\n`;
        const { flagsSchema } = commandEntry;
        if (flagsSchema && Object.keys(flagsSchema.shape).length > 0) {
            const flagLines = [];
            const flagEntries = Object.entries(zod_1.z
                .object({
                help: zod_1.z.boolean().alias('h').describe('Show CLI help'),
            })
                .merge(flagsSchema).shape);
            for (const [flagName, flagSchema] of flagEntries) {
                let schemaDef = flagSchema._def;
                if (schemaDef.typeName === 'ZodOptional' && schemaDef.innerType) {
                    schemaDef = schemaDef.innerType._def;
                }
                const typeName = schemaDef.typeName;
                let flagString = `--${flagName}`;
                if (schemaDef._alias) {
                    flagString = `-${schemaDef._alias}, ${flagString}`;
                }
                if (['ZodString', 'ZodNumber', 'ZodArray'].includes(typeName)) {
                    flagString += ' <value>';
                }
                let flagLine = flagSchema.description ?? '';
                if ('defaultValue' in schemaDef) {
                    const defaultValue = schemaDef.defaultValue();
                    flagLine += ` [default: ${String(defaultValue)}]`;
                }
                flagLines.push([flagString, flagLine]);
            }
            const flagColumnWidth = Math.max(...flagLines.map(([flagString]) => flagString.length));
            output += `${picocolors_1.default.bold('FLAGS')}\n`;
            output += flagLines
                .map(([flagString, flagLine]) => `  ${flagString.padEnd(flagColumnWidth)}  ${flagLine}`)
                .join('\n');
            output += '\n\n';
        }
        output += `${picocolors_1.default.bold('DESCRIPTION')}\n`;
        output += `  ${commandEntry.description}\n`;
        if (commandEntry.examples?.length) {
            output += `\n${picocolors_1.default.bold('EXAMPLES')}\n`;
            output += commandEntry.examples
                .map((example) => `  $ n8n ${commandName}${example ? ` ${example}` : ''}`)
                .join('\n');
            output += '\n';
        }
        this.logger.info(output);
    }
    formatZodError(error) {
        const issuesByFlag = {};
        for (const issue of error.issues) {
            const flag = issue.path[0] ?? 'flags';
            if (!issuesByFlag[flag])
                issuesByFlag[flag] = [];
            issuesByFlag[flag].push(issue);
        }
        let output = '';
        output += picocolors_1.default.red(`\nError: Invalid flags provided for command "${this.commandName}".\n\n`);
        for (const [flag, issues] of Object.entries(issuesByFlag)) {
            const flagLabel = flag === 'flags' ? '(general)' : `--${flag}`;
            output += `  ${picocolors_1.default.bold(flagLabel)}\n`;
            for (const issue of issues) {
                output += `    - ${issue.message}\n`;
            }
            output += '\n';
        }
        return output.trimEnd();
    }
};
exports.CommandRegistry = CommandRegistry;
exports.CommandRegistry = CommandRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [decorators_1.CommandMetadata, backend_common_1.ModuleRegistry, backend_common_1.Logger, backend_common_1.CliParser])
], CommandRegistry);
//# sourceMappingURL=command-registry.js.map