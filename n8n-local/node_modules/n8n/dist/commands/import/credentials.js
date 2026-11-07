"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportCredentialsCommand = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_1 = __importDefault(require("fs"));
const omit_1 = __importDefault(require("lodash/omit"));
const pick_1 = __importDefault(require("lodash/pick"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const credential_descriptions_service_1 = require("../../credentials/credential-descriptions.service");
const constants_1 = require("../../constants");
const credentials_service_1 = require("../../credentials/credentials.service");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../../policy/policy-violation.error");
const base_command_1 = require("../base-command");
const flagsSchema = zod_1.z.object({
    input: zod_1.z
        .string()
        .alias('i')
        .describe('Input file name or directory if --separate is used')
        .optional(),
    separate: zod_1.z
        .boolean()
        .default(false)
        .describe('Imports *.json files from directory provided by --input'),
    include: zod_1.z
        .string()
        .describe('Comma-separated credential properties to include during import')
        .optional(),
    exclude: zod_1.z
        .string()
        .describe('Comma-separated credential properties to exclude during import')
        .optional(),
    userId: zod_1.z
        .string()
        .describe('The ID of the user to assign the imported credentials to')
        .optional(),
    projectId: zod_1.z
        .string()
        .describe('The ID of the project to assign the imported credential to')
        .optional(),
});
const isCredentialData = (data) => typeof data === 'object' && data !== null && !Array.isArray(data);
let ImportCredentialsCommand = class ImportCredentialsCommand extends base_command_1.BaseCommand {
    async init() {
        await super.init();
        await this.initLicense();
        await this.initPolicyEnforcement();
    }
    async run() {
        const { flags } = this;
        if (!flags.input) {
            this.logger.info('An input file or directory with --input must be provided');
            return;
        }
        if (flags.separate) {
            if (fs_1.default.existsSync(flags.input)) {
                if (!fs_1.default.lstatSync(flags.input).isDirectory()) {
                    this.logger.info('The argument to --input must be a directory');
                    return;
                }
            }
        }
        if (flags.projectId && flags.userId) {
            throw new n8n_workflow_1.UserError('You cannot use `--userId` and `--projectId` together. Use one or the other.');
        }
        if (flags.include && flags.exclude) {
            throw new n8n_workflow_1.UserError('You cannot use `--include` and `--exclude` together. Use one or the other.');
        }
        const include = this.parseCredentialProperties(flags.include, '--include');
        const exclude = this.parseCredentialProperties(flags.exclude, '--exclude');
        const credentials = await this.readCredentials({
            inputPath: flags.input,
            separate: flags.separate,
            include,
            exclude,
        });
        const project = await this.getProject(flags.userId, flags.projectId);
        const admitted = [];
        const skipped = [];
        for (const credential of credentials) {
            const outcome = await this.admitCredential(credential, project);
            if ('cleared' in outcome)
                admitted.push(outcome);
            else
                skipped.push(outcome);
        }
        await di_1.Container.get(db_1.DbLockService).withLock(1007, async (transactionManager, ctx) => {
            const result = await this.checkRelations(transactionManager, admitted.map(({ credential }) => credential), project.id, flags);
            if (!result.success) {
                throw new n8n_workflow_1.UserError(result.message);
            }
            for (const entry of admitted) {
                await this.storeCredential(transactionManager, entry, project, ctx);
            }
        });
        this.reportSuccess(credentials.length - skipped.length);
        this.reportSkipped(skipped);
    }
    async catch(error) {
        this.logger.error('An error occurred while importing credentials. See log messages for details.');
        this.logger.error(error.message);
    }
    reportSuccess(total) {
        this.logger.info(`Successfully imported ${total} ${total === 1 ? 'credential.' : 'credentials.'}`);
    }
    reportSkipped(skipped) {
        if (skipped.length === 0)
            return;
        this.logger.warn(`Skipped ${skipped.length} ${skipped.length === 1 ? 'credential' : 'credentials'} blocked by policy:`);
        for (const { id, name, violations } of skipped) {
            this.logger.warn(`  - ${name ?? id ?? 'unknown'}: ${violations.join(', ')}`);
        }
    }
    async admitCredential(credential, project) {
        await di_1.Container.get(credential_descriptions_service_1.CredentialDescriptionsService).stripIfDisabled(credential);
        if (credential.description !== undefined) {
            const parsed = api_types_1.credentialDescriptionSchema.safeParse(credential.description);
            if (!parsed.success) {
                throw new n8n_workflow_1.UserError(`Credential "${credential.id ?? credential.name ?? 'unknown'}": ${parsed.error.issues[0].message}`);
            }
            credential.description = parsed.data;
        }
        let existing = null;
        if (credential.id) {
            existing = await di_1.Container.get(db_1.CredentialsRepository).findOne({
                where: { id: credential.id },
                select: ['id', 'usageScope', 'type'],
            });
            if (existing) {
                credential.usageScope = existing.usageScope;
                if (existing.usageScope === 'instance' &&
                    credential.type !== undefined &&
                    credential.type !== existing.type) {
                    throw new n8n_workflow_1.UserError('Provider connection type cannot be changed. Create a new connection instead.');
                }
            }
        }
        credential.usageScope ??= 'project';
        credential.pendingAuthorizationExpiresAt = null;
        const type = credential.type ?? existing?.type;
        if (type === undefined) {
            throw new n8n_workflow_1.UserError(`Credential "${credential.id ?? credential.name ?? 'unknown'}" is missing a type`);
        }
        credential.type = type;
        let landingProjectId = project.id;
        if (existing) {
            const ownerProject = await di_1.Container.get(db_1.SharedCredentialsRepository).findCredentialOwningProject(existing.id);
            if (ownerProject)
                landingProjectId = ownerProject.id;
        }
        let cleared;
        try {
            cleared = await di_1.Container.get(policy_enforcement_service_1.PolicyEnforcementService).enforceContentImport({
                credential: { id: credential.id ?? null, type },
                projectId: credential.usageScope === 'instance' ? null : landingProjectId,
                transport: 'cli',
            }, { kind: 'system', reason: 'cli-import' });
        }
        catch (error) {
            if (!(error instanceof policy_violation_error_1.PolicyViolationError))
                throw error;
            this.logger.warn(`Skipping credential ${credential.id ?? credential.name ?? 'unknown'}: blocked by policy`);
            return {
                id: credential.id,
                name: credential.name,
                violations: error.violations.map((violation) => violation.message),
            };
        }
        return { credential: { ...credential, type }, existing, cleared };
    }
    async storeCredential(transactionManager, { credential, existing, cleared }, project, ctx) {
        if (credential.usageScope === 'instance') {
            if (credential.isGlobal ||
                credential.isResolvable ||
                credential.isManaged ||
                credential.resolvableAllowFallback ||
                credential.resolverId) {
                throw new n8n_workflow_1.UserError('Provider connections cannot be global, managed, or dynamically resolved');
            }
            Object.assign(credential, {
                isGlobal: false,
                isResolvable: false,
                isManaged: false,
                resolvableAllowFallback: false,
                resolverId: null,
            });
            await this.validateInstanceCredentialData(transactionManager, credential, existing, ctx);
        }
        const credentialsId = await di_1.Container.get(db_1.CredentialsRepository).upsertImportedContent(credential, { ...ctx, policyCleared: cleared });
        if (credential.usageScope === 'instance') {
            await transactionManager.delete(db_1.SharedCredentials, { credentialsId });
            return;
        }
        const sharingExists = await transactionManager.existsBy(db_1.SharedCredentials, {
            credentialsId,
            role: 'credential:owner',
        });
        if (!sharingExists) {
            await transactionManager.upsert(db_1.SharedCredentials, {
                credentialsId,
                role: 'credential:owner',
                projectId: project.id,
            }, ['credentialsId', 'projectId']);
        }
    }
    async validateInstanceCredentialData(transactionManager, credential, existing, ctx) {
        let data = credential.data;
        if (data === undefined && credential.id) {
            data = (await transactionManager.findOne(db_1.CredentialsEntity, {
                where: { id: credential.id },
                select: { data: true },
            }))?.data;
        }
        if (data === undefined)
            return;
        if (data === null || data === '') {
            throw new n8n_workflow_1.UserError('Provider connection data cannot be empty');
        }
        const decrypted = typeof data === 'string'
            ? (0, n8n_workflow_1.jsonParse)(await di_1.Container.get(n8n_core_1.Cipher).decryptV2(data))
            : data;
        if (!isCredentialData(decrypted)) {
            throw new n8n_workflow_1.UserError('Provider connection data must be a JSON object');
        }
        const credentialsService = di_1.Container.get(credentials_service_1.CredentialsService);
        if (existing?.usageScope === 'instance') {
            await credentialsService.validateInstanceCredentialUpdate(existing, decrypted, undefined, ctx);
        }
        else {
            credentialsService.validateInstanceCredentialData(decrypted);
        }
    }
    async checkRelations(transactionManager, credentials, targetProjectId, { userId, projectId }) {
        if (!projectId && !userId) {
            return {
                success: true,
                message: undefined,
            };
        }
        for (const credential of credentials) {
            if (credential.id === undefined) {
                continue;
            }
            if (!(await this.credentialExists(transactionManager, credential.id))) {
                continue;
            }
            const { user, project: ownerProject } = await this.getCredentialOwner(transactionManager, credential.id);
            if (!ownerProject) {
                continue;
            }
            if (ownerProject.id !== targetProjectId) {
                const currentOwner = ownerProject.type === 'personal'
                    ? `the user with the ID "${user.id}"`
                    : `the project with the ID "${ownerProject.id}"`;
                const newOwner = userId
                    ?
                        `the user with the ID "${userId}"`
                    : `the project with the ID "${projectId}"`;
                return {
                    success: false,
                    message: `The credential with ID "${credential.id}" is already owned by ${currentOwner}. It can't be re-owned by ${newOwner}.`,
                };
            }
        }
        return {
            success: true,
            message: undefined,
        };
    }
    async readCredentials(options) {
        const { separate, include, exclude } = options;
        const cipher = di_1.Container.get(n8n_core_1.Cipher);
        let { inputPath } = options;
        if (process.platform === 'win32') {
            inputPath = inputPath.replace(/\\/g, '/');
        }
        let credentials;
        if (separate) {
            const files = await (0, fast_glob_1.default)('*.json', {
                cwd: inputPath,
                absolute: true,
            });
            credentials = files.map((file) => (0, n8n_workflow_1.jsonParse)(fs_1.default.readFileSync(file, { encoding: 'utf8' })));
        }
        else {
            const credentialsUnchecked = (0, n8n_workflow_1.jsonParse)(fs_1.default.readFileSync(inputPath, { encoding: 'utf8' }));
            if (!Array.isArray(credentialsUnchecked)) {
                throw new n8n_workflow_1.UserError('File does not seem to contain credentials. Make sure the credentials are contained in an array.');
            }
            credentials = credentialsUnchecked;
        }
        const knownProperties = new Set(credentials.flatMap((credential) => Object.keys(credential)));
        this.warnOnUnknownProperties(include, knownProperties, '--include');
        this.warnOnUnknownProperties(exclude, knownProperties, '--exclude');
        return await Promise.all(credentials.map(async (credential) => {
            const filteredCredential = this.filterCredentialProperties(credential, include, exclude);
            if (isCredentialData(filteredCredential.data)) {
                filteredCredential.data = await cipher.encryptV2(filteredCredential.data);
            }
            return filteredCredential;
        }));
    }
    parseCredentialProperties(value, flagName) {
        if (!value)
            return undefined;
        const propertyCandidates = value.split(',');
        const trimmedProperties = propertyCandidates.map((property) => property.trim());
        const nonEmptyProperties = trimmedProperties.filter(Boolean);
        const uniqueProperties = Array.from(new Set(nonEmptyProperties));
        if (uniqueProperties.length === 0) {
            throw new n8n_workflow_1.UserError(`${flagName} must contain at least one property name.`);
        }
        return uniqueProperties;
    }
    warnOnUnknownProperties(properties, knownProperties, flagName) {
        if (!properties?.length)
            return;
        const unknownProperties = properties.filter((property) => !knownProperties.has(property));
        if (unknownProperties.length === 0)
            return;
        this.logger.warn(`Ignoring unknown properties from ${flagName}: ${unknownProperties.join(', ')}`);
    }
    filterCredentialProperties(credential, include, exclude) {
        if (include?.length) {
            const includeProperties = include.filter((property) => this.isCredentialPropertyImportable(property));
            if (includeProperties.length === 0) {
                throw new n8n_workflow_1.UserError('No importable properties found. Please check the --include flag.');
            }
            return (0, pick_1.default)(credential, includeProperties);
        }
        if (exclude?.length) {
            const excludeProperties = exclude.filter((property) => this.isCredentialPropertyImportable(property));
            return (0, omit_1.default)(credential, excludeProperties);
        }
        return credential;
    }
    isCredentialPropertyImportable(property) {
        const importableProperties = {
            createdAt: true,
            updatedAt: true,
            id: true,
            name: true,
            description: true,
            data: true,
            type: true,
            isManaged: true,
            isGlobal: true,
            isResolvable: true,
            resolvableAllowFallback: true,
            resolverId: true,
            usageScope: true,
        };
        return property in importableProperties;
    }
    async getCredentialOwner(transactionManager, credentialsId) {
        const sharedCredential = await transactionManager.findOne(db_1.SharedCredentials, {
            where: { credentialsId, role: 'credential:owner' },
            relations: { project: true },
        });
        if (sharedCredential && sharedCredential.project.type === 'personal') {
            const user = await transactionManager.findOneByOrFail(db_1.User, {
                projectRelations: {
                    role: { slug: permissions_1.PROJECT_OWNER_ROLE_SLUG },
                    projectId: sharedCredential.projectId,
                },
            });
            return { user, project: sharedCredential.project };
        }
        return {};
    }
    async credentialExists(transactionManager, credentialId) {
        return await transactionManager.existsBy(db_1.CredentialsEntity, { id: credentialId });
    }
    async getProject(userId, projectId) {
        if (projectId) {
            return await di_1.Container.get(db_1.ProjectRepository).findOneByOrFail({ id: projectId });
        }
        if (!userId) {
            const owner = await di_1.Container.get(db_1.UserRepository).findOneBy({
                role: {
                    slug: db_1.GLOBAL_OWNER_ROLE.slug,
                },
            });
            if (!owner) {
                throw new n8n_workflow_1.UserError(`Failed to find owner. ${constants_1.UM_FIX_INSTRUCTION}`);
            }
            userId = owner.id;
        }
        return await di_1.Container.get(db_1.ProjectRepository).getPersonalProjectForUserOrFail(userId);
    }
};
exports.ImportCredentialsCommand = ImportCredentialsCommand;
exports.ImportCredentialsCommand = ImportCredentialsCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'import:credentials',
        description: 'Import credentials',
        examples: [
            '--input=file.json',
            '--separate --input=backups/latest/',
            '--input=file.json --include=id,name,type,data',
            '--input=file.json --exclude=createdAt,updatedAt',
            '--input=file.json --userId=1d64c3d2-85fe-4a83-a649-e446b07b3aae',
            '--input=file.json --projectId=Ox8O54VQrmBrb4qL',
            '--separate --input=backups/latest/ --userId=1d64c3d2-85fe-4a83-a649-e446b07b3aae',
        ],
        flagsSchema,
    })
], ImportCredentialsCommand);
//# sourceMappingURL=credentials.js.map