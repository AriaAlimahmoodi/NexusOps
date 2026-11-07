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
exports.LoadNodesAndCredentials = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const is_windows_file_path_1 = require("@n8n/utils/files/is-windows-file-path");
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = __importDefault(require("fs/promises"));
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = __importDefault(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const constants_1 = require("./constants");
const output_schema_parameter_defaults_1 = require("./output-schema-parameter-defaults");
const tool_generation_1 = require("./tool-generation");
let LoadNodesAndCredentials = class LoadNodesAndCredentials {
    constructor(logger, errorReporter, instanceSettings, globalConfig, moduleRegistry, executionContextHookRegistry) {
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.instanceSettings = instanceSettings;
        this.globalConfig = globalConfig;
        this.moduleRegistry = moduleRegistry;
        this.executionContextHookRegistry = executionContextHookRegistry;
        this.known = { nodes: {}, credentials: {} };
        this.loaded = { nodes: {}, credentials: {} };
        this.types = { nodes: [], credentials: [] };
        this.loaders = {};
        this.excludeNodes = this.globalConfig.nodes.exclude;
        this.includeNodes = this.globalConfig.nodes.include;
        this.postProcessors = [];
        this.rebuildQueue = Promise.resolve();
        this.augmentNodeTypeDescription = (node) => {
            const hooks = this.executionContextHookRegistry.getHookForTriggerType(node.name);
            if (hooks.length > 0) {
                this.logger.debug(`Found ${hooks.length} hooks for trigger node: ${node.name}`);
            }
            if (hooks.length === 0)
                return;
            if (node.properties.some((p) => p.name === 'executionsHooksVersion'))
                return;
            const allHookValues = [
                {
                    displayName: 'User Identifier',
                    name: 'hookName',
                    type: 'options',
                    noDataExpression: true,
                    options: hooks.map((hook) => {
                        const displayName = hook.hookDescription.displayName ?? hook.hookDescription.name;
                        return {
                            name: displayName,
                            value: hook.hookDescription.name,
                            description: `Use ${displayName} hook`,
                        };
                    }),
                    default: '',
                    description: 'Configure how n8n extracts the identity token of the user triggering a webhook. It is used to run each execution with the correct user.',
                    required: true,
                },
            ];
            for (const hook of hooks) {
                const hookOptions = hook.hookDescription.options ?? [];
                if (hookOptions.length > 0) {
                    for (const hookOption of hookOptions) {
                        const enhancedOption = {
                            ...hookOption,
                            displayOptions: {
                                ...hookOption.displayOptions,
                                show: {
                                    ...hookOption.displayOptions?.show,
                                    hookName: [hook.hookDescription.name],
                                },
                            },
                        };
                        allHookValues.push(enhancedOption);
                    }
                }
            }
            const executionsHooksVersion = {
                displayName: 'Executions Hooks Version',
                name: 'executionsHooksVersion',
                type: 'hidden',
                default: 1,
            };
            const contextHooksProperty = {
                displayName: 'Identify user for end-user credentials',
                name: 'contextEstablishmentHooks',
                type: 'fixedCollection',
                placeholder: 'Add User Identifier',
                default: {},
                typeOptions: {
                    multipleValues: true,
                    hideEmptyMessage: true,
                },
                options: [
                    {
                        name: 'hooks',
                        displayName: 'Hooks',
                        values: allHookValues,
                    },
                ],
                description: 'Configure how n8n extracts the identity token of the user triggering a webhook. It is used to run each execution with the correct user.',
            };
            const contextHooksNotice = {
                displayName: 'Configure how n8n extracts the identity token of the user triggering a webhook. It is used to run each execution with the correct user.',
                name: 'contextHooksNotice',
                type: 'notice',
                default: '',
            };
            let index = node.properties.findIndex((p) => p.name === 'options');
            if (index === -1) {
                index = node.properties.length;
            }
            node.properties.splice(index, 0, contextHooksNotice);
            node.properties.splice(index, 0, contextHooksProperty);
            node.properties.splice(index, 0, executionsHooksVersion);
        };
        this.reloadQueue = Promise.resolve();
    }
    async init() {
        if (backend_common_1.inTest)
            throw new n8n_workflow_1.UnexpectedError('Not available in tests');
        const delimiter = process.platform === 'win32' ? ';' : ':';
        process.env.NODE_PATH = [module.paths.join(delimiter), process.env.NODE_PATH]
            .filter(Boolean)
            .join(delimiter);
        module.constructor._initPaths();
        if (!constants_1.inE2ETests) {
            this.excludeNodes = this.excludeNodes ?? [];
            this.excludeNodes.push('n8n-nodes-base.e2eTest');
        }
        if (!(0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_DYNAMIC_CREDENTIALS')) {
            this.excludeNodes = this.excludeNodes ?? [];
            this.excludeNodes.push('n8n-nodes-base.dynamicCredentialCheck');
        }
        const basePathsToScan = [
            path_1.default.join(constants_1.CLI_DIR, '..'),
            path_1.default.join(constants_1.CLI_DIR, 'node_modules'),
        ];
        for (const nodeModulesDir of basePathsToScan) {
            await this.loadNodesFromNodeModules(nodeModulesDir, 'n8n-nodes-base');
            await this.loadNodesFromNodeModules(nodeModulesDir, '@n8n/n8n-nodes-langchain');
        }
        await this.loadNodesFromCustomDirectories();
        for (const loader of this.moduleRegistry.nodeLoaders) {
            if (loader.packageName in this.loaders) {
                throw new n8n_workflow_1.UnexpectedError(picocolors_1.default.red(`Node loader ${loader.packageName} is already registered.`));
            }
            try {
                await loader.loadAll();
                this.loaders[loader.packageName] = loader;
            }
            catch (error) {
                this.logger.error(`Failed to load package "${loader.packageName}"`, {
                    error: (0, ensure_error_1.ensureError)(error),
                });
                this.errorReporter.error(error, { extra: { packageName: loader.packageName } });
            }
        }
        await this.postProcessLoaders();
    }
    addPostProcessor(fn) {
        this.postProcessors.push(fn);
    }
    releaseTypes() {
        void this.enqueueRebuild(() => this.releaseTypesNow());
    }
    releaseTypesNow() {
        this.types = { nodes: [], credentials: [] };
        for (const loader of Object.values(this.loaders)) {
            loader.releaseTypes();
        }
    }
    async collectTypes() {
        if (this.hasTypes())
            return this.snapshotTypes();
        return await this.enqueueRebuild(async () => {
            if (this.hasTypes())
                return this.snapshotTypes();
            await this.rebuildRegistry();
            const types = this.snapshotTypes();
            this.releaseTypesNow();
            return types;
        });
    }
    hasTypes() {
        return this.types.nodes.length > 0 || this.types.credentials.length > 0;
    }
    snapshotTypes() {
        return { nodes: this.types.nodes, credentials: this.types.credentials };
    }
    async enqueueRebuild(task) {
        const run = this.rebuildQueue.then(task);
        this.rebuildQueue = run.catch(() => { });
        return await run;
    }
    isKnownNode(type) {
        return type in this.known.nodes;
    }
    get loadedCredentials() {
        return this.loaded.credentials;
    }
    get loadedNodes() {
        return this.loaded.nodes;
    }
    get knownCredentials() {
        return this.known.credentials;
    }
    get knownNodes() {
        return this.known.nodes;
    }
    async loadNodesFromNodeModules(nodeModulesDir, packageName) {
        const installedPackagePaths = await (0, fast_glob_1.default)(packageName, {
            cwd: nodeModulesDir,
            onlyDirectories: true,
            deep: 1,
        });
        for (const packagePath of installedPackagePaths) {
            try {
                await this.runDirectoryLoader(n8n_core_1.LazyPackageDirectoryLoader, path_1.default.join(nodeModulesDir, packagePath));
            }
            catch (error) {
                this.logger.error(error.message);
                this.errorReporter.error(error);
            }
        }
    }
    resolveIcon(packageName, url) {
        const isCustom = packageName === n8n_core_1.CUSTOM_NODES_PACKAGE_NAME;
        const loader = this.loaders[packageName];
        if (!loader || !(loader instanceof n8n_core_1.DirectoryLoader)) {
            return undefined;
        }
        const resolvePath = (iconPath) => {
            return path_1.default.resolve(loader.directory, iconPath);
        };
        const resolvePathCustom = (path) => {
            if ((0, is_windows_file_path_1.isWindowsFilePath)(path))
                return path;
            return path.startsWith('/') ? path : '/' + path;
        };
        const pathPrefix = `/icons/${packageName}/`;
        const urlFilePath = url.substring(pathPrefix.length);
        if (isCustom && !(0, is_windows_file_path_1.isWindowsFilePath)(urlFilePath)) {
            const relativeFilePath = resolvePath(urlFilePath);
            if ((0, backend_common_1.isContainedWithin)(loader.directory, relativeFilePath)) {
                return relativeFilePath;
            }
        }
        const filePath = isCustom ? resolvePathCustom(urlFilePath) : resolvePath(urlFilePath);
        return (0, backend_common_1.isContainedWithin)(loader.directory, filePath) ? filePath : undefined;
    }
    resolveSchema({ node, version, resource, operation, }) {
        const nodePath = this.known.nodes[node]?.sourcePath;
        if (!nodePath) {
            return undefined;
        }
        return (0, n8n_core_1.resolveOutputSchemaPath)({
            nodeDir: path_1.default.dirname(nodePath),
            version,
            resource,
            operation,
        });
    }
    createOutputSchemaLookup() {
        return ({ type, typeVersion, resource, operation, hasOutputParser, parameters }) => {
            const nodePath = this.known.nodes[type]?.sourcePath;
            if (!nodePath)
                return undefined;
            const nodeType = this.tryGetVersionedNodeType(type, typeVersion);
            return (0, n8n_core_1.loadOutputSchema)({
                nodeDir: path_1.default.dirname(nodePath),
                version: typeVersion,
                resource,
                operation,
                versionFallback: true,
                variant: hasOutputParser ? n8n_core_1.OUTPUT_PARSER_SCHEMA_VARIANT : undefined,
                parameters,
                parameterDefaults: (0, output_schema_parameter_defaults_1.getParameterDefaults)(nodeType?.description.properties, {
                    resource,
                    operation,
                }),
            });
        };
    }
    tryGetVersionedNodeType(type, version) {
        try {
            return n8n_workflow_1.NodeHelpers.getVersionedNodeType(this.getNode(type).type, version);
        }
        catch {
            return undefined;
        }
    }
    getCustomDirectories() {
        const customDirectories = [this.instanceSettings.customExtensionDir];
        if (process.env[n8n_core_1.CUSTOM_EXTENSION_ENV] !== undefined) {
            const customExtensionFolders = process.env[n8n_core_1.CUSTOM_EXTENSION_ENV].split(';');
            customDirectories.push(...customExtensionFolders);
        }
        return customDirectories;
    }
    async loadNodesFromCustomDirectories() {
        for (const directory of this.getCustomDirectories()) {
            await this.runDirectoryLoader(n8n_core_1.CustomDirectoryLoader, directory);
        }
    }
    async loadPackage(packageName) {
        const finalNodeUnpackedPath = path_1.default.join(this.instanceSettings.nodesDownloadDir, 'node_modules', packageName);
        return await this.runDirectoryLoader(n8n_core_1.PackageDirectoryLoader, finalNodeUnpackedPath);
    }
    async unloadPackage(packageName) {
        if (packageName in this.loaders) {
            this.loaders[packageName].reset();
            delete this.loaders[packageName];
        }
    }
    supportsProxyAuth(description) {
        if (!description.credentials)
            return false;
        return description.credentials.some(({ name }) => {
            const credType = this.types.credentials.find((t) => t.name === name);
            if (!credType) {
                this.logger.warn(`Failed to load Custom API options for the node "${description.name}": Unknown credential name "${name}"`);
                return false;
            }
            if (credType.authenticate !== undefined)
                return true;
            return this.extendsProxyAuthBaseType(credType);
        });
    }
    extendsProxyAuthBaseType(credType, seen = new Set()) {
        if (!Array.isArray(credType.extends))
            return false;
        return credType.extends.some((parentName) => {
            if (['oAuth2Api', 'googleOAuth2Api', 'oAuth1Api'].includes(parentName))
                return true;
            if (seen.has(parentName))
                return false;
            seen.add(parentName);
            const parent = this.types.credentials.find((t) => t.name === parentName);
            return parent !== undefined && this.extendsProxyAuthBaseType(parent, seen);
        });
    }
    injectCustomApiCallOptions() {
        this.types.nodes.forEach((node) => {
            const isLatestVersion = node.defaultVersion === undefined || node.defaultVersion === node.version;
            if (isLatestVersion) {
                if (!this.supportsProxyAuth(node))
                    return;
                node.properties.forEach((p) => {
                    if (['resource', 'operation'].includes(p.name) &&
                        Array.isArray(p.options) &&
                        p.options[p.options.length - 1].name !== constants_1.CUSTOM_API_CALL_NAME) {
                        p.options.push({
                            name: constants_1.CUSTOM_API_CALL_NAME,
                            value: constants_1.CUSTOM_API_CALL_KEY,
                        });
                    }
                });
            }
        });
    }
    shouldInjectContextEstablishmentHooks() {
        return (0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_DYNAMIC_CREDENTIALS');
    }
    injectContextEstablishmentHooks() {
        const isEnabled = this.shouldInjectContextEstablishmentHooks();
        if (!isEnabled) {
            this.logger.debug('Context establishment hooks feature is disabled');
            return;
        }
        const triggerNodes = this.types.nodes.filter((node) => node.group.includes('trigger'));
        this.logger.debug(`Injecting context establishment hooks for ${triggerNodes.length} trigger nodes`);
        triggerNodes.forEach(this.augmentNodeTypeDescription);
    }
    async runDirectoryLoader(constructor, dir) {
        const loader = new constructor(dir, this.excludeNodes, this.includeNodes);
        if (loader instanceof n8n_core_1.PackageDirectoryLoader && loader.packageName in this.loaders) {
            throw new n8n_workflow_1.UserError(picocolors_1.default.red(`nodes package ${loader.packageName} is already loaded.\n Please delete this second copy at path ${dir}`));
        }
        await loader.loadAll();
        this.loaders[loader.packageName] = loader;
        return loader;
    }
    async postProcessLoaders() {
        await this.enqueueRebuild(async () => await this.rebuildRegistry());
    }
    async rebuildRegistry() {
        const known = { nodes: {}, credentials: {} };
        const loaded = { nodes: {}, credentials: {} };
        const types = { nodes: [], credentials: [] };
        for (const loader of Object.values(this.loaders)) {
            await loader.ensureTypesLoaded();
            const { known: loaderKnown, types: loaderTypes, packageName } = loader;
            types.nodes = types.nodes.concat(loaderTypes.nodes.map(({ name, ...rest }) => ({
                ...rest,
                name: `${packageName}.${name}`,
            })));
            const processedCredentials = loaderTypes.credentials.map((credential) => ({
                ...credential,
                properties: (0, n8n_workflow_1.injectDomainRestrictionFields)(credential),
                supportedNodes: loader instanceof n8n_core_1.PackageDirectoryLoader
                    ? credential.supportedNodes?.map((nodeName) => `${loader.packageName}.${nodeName}`)
                    : undefined,
            }));
            types.credentials = types.credentials.concat(processedCredentials);
            for (const credentialTypeName in loaderKnown.credentials) {
                const credentialType = loader.getCredential(credentialTypeName);
                credentialType.type.properties = (0, n8n_workflow_1.injectDomainRestrictionFields)(credentialType.type);
            }
            for (const type in loaderKnown.nodes) {
                const { className, sourcePath } = loaderKnown.nodes[type];
                known.nodes[`${packageName}.${type}`] = {
                    className,
                    sourcePath: loader.resolveSourcePath(sourcePath),
                };
            }
            for (const type in loaderKnown.credentials) {
                const { className, sourcePath, supportedNodes, extends: extendsArr, } = loaderKnown.credentials[type];
                known.credentials[type] = {
                    className,
                    sourcePath: loader.resolveSourcePath(sourcePath),
                    supportedNodes: loader instanceof n8n_core_1.PackageDirectoryLoader
                        ? supportedNodes?.map((nodeName) => `${loader.packageName}.${nodeName}`)
                        : undefined,
                    extends: extendsArr,
                };
            }
        }
        this.known = known;
        this.loaded = loaded;
        this.types = types;
        (0, tool_generation_1.createAiTools)(this.types, this.known);
        (0, tool_generation_1.createHitlTools)(this.types, this.known);
        this.types.nodes = this.types.nodes.filter(({ name }) => !this.excludeNodes.includes(name));
        this.known.nodes = Object.fromEntries(Object.entries(this.known.nodes).filter(([name]) => !this.excludeNodes.includes(name)));
        this.known.credentials = Object.fromEntries(Object.entries(this.known.credentials).map(([name, credential]) => [
            name,
            {
                ...credential,
                supportedNodes: credential.supportedNodes?.filter((node) => !this.excludeNodes.includes(node)),
            },
        ]));
        this.injectCustomApiCallOptions();
        this.injectContextEstablishmentHooks();
        for (const postProcessor of this.postProcessors) {
            await postProcessor();
        }
    }
    splitNodeType(fullNodeType) {
        const separatorIndex = fullNodeType.indexOf('.');
        if (separatorIndex === -1)
            return [fullNodeType, ''];
        return [fullNodeType.slice(0, separatorIndex), fullNodeType.slice(separatorIndex + 1)];
    }
    recognizesNode(fullNodeType) {
        const [packageName, nodeType] = this.splitNodeType(fullNodeType);
        const { loaders } = this;
        const loader = loaders[packageName];
        return !!loader && nodeType in loader.known.nodes;
    }
    getNode(fullNodeType) {
        const [packageName, nodeType] = this.splitNodeType(fullNodeType);
        const { loaders } = this;
        const loader = loaders[packageName];
        if (!loader) {
            throw new n8n_core_1.UnrecognizedNodeTypeError(packageName, nodeType);
        }
        const loadedNode = loader.getNode(nodeType);
        if (this.shouldInjectContextEstablishmentHooks() &&
            'properties' in loadedNode.type.description) {
            this.augmentNodeTypeDescription(loadedNode.type.description);
        }
        return loadedNode;
    }
    resolveNodeSourcePath(fullNodeType, sourcePath) {
        const [packageName] = fullNodeType.split('.');
        const loader = this.loaders[packageName];
        return loader ? loader.resolveSourcePath(sourcePath) : sourcePath;
    }
    getCredential(credentialType) {
        const { loadedCredentials } = this;
        for (const loader of Object.values(this.loaders)) {
            if (credentialType in loader.known.credentials) {
                const loaded = loader.getCredential(credentialType);
                loadedCredentials[credentialType] = loaded;
            }
        }
        if (credentialType in loadedCredentials) {
            return loadedCredentials[credentialType];
        }
        throw new n8n_core_1.UnrecognizedCredentialTypeError(credentialType);
    }
    async reloadLoader(loader) {
        const run = this.reloadQueue.then(async () => {
            this.logger.info(`Hot reload triggered for ${loader.packageName}`);
            try {
                loader.reset();
                await loader.loadAll();
                await this.postProcessLoaders();
                const { Push } = await import('./push/index.js');
                di_1.Container.get(Push).broadcast({ type: 'nodeDescriptionUpdated', data: {} });
            }
            catch (error) {
                this.logger.error(`Hot reload failed for ${loader.packageName}`, {
                    error: (0, ensure_error_1.ensureError)(error),
                });
                throw new n8n_workflow_1.UserError(`Hot reload failed for ${loader.packageName}`, { cause: error });
            }
        });
        this.reloadQueue = run.catch(() => { });
        await run;
    }
    async reloadCustomNodes() {
        const loaders = Object.values(this.loaders).filter((loader) => loader instanceof n8n_core_1.CustomDirectoryLoader);
        for (const loader of loaders) {
            await this.reloadLoader(loader);
        }
        return loaders.map((loader) => loader.packageName);
    }
    async setupHotReload() {
        const { default: debounce } = await import('lodash/debounce.js');
        let subscribe;
        try {
            ({ subscribe } = await import('@parcel/watcher'));
        }
        catch (error) {
            this.logger.warn('File watching for hot reload is unavailable on this platform. Use POST /rest/dev/reload to reload nodes.', { error: (0, ensure_error_1.ensureError)(error) });
            return;
        }
        for (const loader of Object.values(this.loaders)) {
            if (!(loader instanceof n8n_core_1.DirectoryLoader))
                continue;
            const { directory } = loader;
            try {
                await promises_1.default.access(directory);
            }
            catch {
                continue;
            }
            const reloader = debounce(async () => await this.reloadLoader(loader).catch(() => { }), 100);
            const watchPaths = loader.isLazyLoaded ? [path_1.default.join(directory, 'dist')] : [directory];
            const customNodesRoot = path_1.default.join(directory, 'node_modules');
            if (loader.packageName === n8n_core_1.CUSTOM_NODES_PACKAGE_NAME) {
                const customNodeEntries = await promises_1.default.readdir(customNodesRoot, {
                    withFileTypes: true,
                });
                const realCustomNodesPaths = await Promise.all(customNodeEntries
                    .filter((entry) => (entry.isDirectory() || entry.isSymbolicLink()) && !entry.name.startsWith('.'))
                    .map(async (entry) => await promises_1.default.realpath(path_1.default.join(customNodesRoot, entry.name)).catch(() => null)));
                watchPaths.push.apply(watchPaths, realCustomNodesPaths.filter((path) => !!path));
            }
            this.logger.debug('Watching node folders for hot reload', {
                loader: loader.packageName,
                paths: watchPaths,
            });
            for (const watchPath of watchPaths) {
                const onFileEvent = async (_error, events) => {
                    if (events.some((event) => event.type !== 'delete')) {
                        const modules = Object.keys(require.cache).filter((module) => module.startsWith(watchPath));
                        for (const module of modules) {
                            delete require.cache[module];
                        }
                        await reloader();
                    }
                };
                const ignore = ['**/node_modules/**/node_modules/**'];
                await subscribe(watchPath, onFileEvent, { ignore });
            }
        }
    }
};
exports.LoadNodesAndCredentials = LoadNodesAndCredentials;
exports.LoadNodesAndCredentials = LoadNodesAndCredentials = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter, n8n_core_1.InstanceSettings, config_1.GlobalConfig, backend_common_1.ModuleRegistry, n8n_core_1.ExecutionContextHookRegistry])
], LoadNodesAndCredentials);
//# sourceMappingURL=load-nodes-and-credentials.js.map