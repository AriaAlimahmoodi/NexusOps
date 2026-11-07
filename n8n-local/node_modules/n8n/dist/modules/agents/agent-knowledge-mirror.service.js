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
exports.AgentKnowledgeMirrorService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const run_serially_1 = require("@n8n/utils/run-serially");
const escapeRegExp_1 = __importDefault(require("lodash/escapeRegExp"));
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const errors_1 = require("@n8n/errors");
const agent_knowledge_commands_1 = require("./agent-knowledge-commands");
const agent_knowledge_file_store_1 = require("./agent-knowledge-file-store");
const agent_knowledge_retrieval_1 = require("./agent-knowledge-retrieval");
const agent_knowledge_storage_1 = require("./agent-knowledge-storage");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
const agent_file_repository_1 = require("./repositories/agent-file.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const GLOB_MATCH_TIMEOUT_MS = 250;
function emptySearchKnowledgeResult(outputMode, limit) {
    if (outputMode === 'files_with_matches') {
        return { outputMode, files: [], limit, hasMore: false, truncated: false };
    }
    if (outputMode === 'count') {
        return { outputMode, counts: [], limit, hasMore: false, truncated: false };
    }
    return { outputMode, matches: [], limit, hasMore: false, truncated: false };
}
function parseMirrorManifest(output) {
    const manifest = new Map();
    for (const entry of output.split(/\r?\n/)) {
        const line = entry.trim();
        if (!line)
            continue;
        const separator = line.indexOf('\t');
        if (separator === -1) {
            manifest.set(line, '');
        }
        else {
            manifest.set(line.slice(separator + 1), line.slice(0, separator));
        }
    }
    return manifest;
}
function formatSandboxCommandFailure(operation, result) {
    const stderrText = (0, agent_sandbox_runtime_service_1.sanitizeSandboxErrorDetail)(result.stderr);
    const stdoutText = (0, agent_sandbox_runtime_service_1.sanitizeSandboxErrorDetail)(result.stdout);
    const parts = [`Agent knowledge ${operation} failed`, `exitCode=${result.exitCode}`];
    parts.push(stderrText ? `stderr=${stderrText}` : 'stderr=<empty>');
    parts.push(stdoutText ? `stdout=${stdoutText}` : 'stdout=<empty>');
    return parts.join('; ');
}
function assertKnowledgeFilesDirectoryAvailable(operation, result) {
    if (result.exitCode !== agent_knowledge_commands_1.KNOWLEDGE_FILES_DIR_UNAVAILABLE_EXIT_CODE)
        return;
    throw new n8n_workflow_1.OperationalError(`Agent knowledge ${operation} failed because the uploaded knowledge files directory is unavailable in the sandbox`);
}
let AgentKnowledgeMirrorService = class AgentKnowledgeMirrorService {
    constructor(agentsConfig, logger, agentSandboxRuntimeService, agentFileRepository, agentRepository, agentKnowledgeFileStore) {
        this.agentsConfig = agentsConfig;
        this.logger = logger;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
        this.agentFileRepository = agentFileRepository;
        this.agentRepository = agentRepository;
        this.agentKnowledgeFileStore = agentKnowledgeFileStore;
        this.pendingMirrorSyncs = new Map();
    }
    async searchKnowledge(projectId, agentId, request) {
        const validatedRequest = (0, agent_knowledge_retrieval_1.parseSearchKnowledgeRequest)(request);
        const references = await this.loadKnowledgeReferenceLookup(projectId, agentId);
        const outputMode = validatedRequest.output_mode ?? 'content';
        const limit = validatedRequest.head_limit ?? agent_knowledge_retrieval_1.DEFAULT_SEARCH_TEXT_LIMIT;
        if (references.files.length === 0) {
            return emptySearchKnowledgeResult(outputMode, limit);
        }
        const scopedFiles = this.resolveSearchFiles(validatedRequest, references);
        const command = (0, agent_knowledge_commands_1.buildSearchKnowledgeCommand)(validatedRequest, scopedFiles.map((file) => file.file));
        const result = await this.executeKnowledgeOperation(projectId, agentId, command, references.files);
        assertKnowledgeFilesDirectoryAvailable('search', result);
        if (result.exitCode === 1) {
            return emptySearchKnowledgeResult(outputMode, limit);
        }
        if (result.exitCode !== 0) {
            throw new n8n_workflow_1.OperationalError(formatSandboxCommandFailure('search', result));
        }
        return this.parseSearchResult(result.stdout, validatedRequest, references, outputMode, limit);
    }
    async globKnowledgeFiles(projectId, agentId, request) {
        const validatedRequest = (0, agent_knowledge_retrieval_1.parseGlobKnowledgeFilesRequest)(request);
        const references = await this.loadKnowledgeReferenceLookup(projectId, agentId);
        const limit = validatedRequest.limit ?? agent_knowledge_retrieval_1.DEFAULT_GLOB_FILES_LIMIT;
        const offset = validatedRequest.offset ?? 0;
        if (references.files.length === 0) {
            return { files: [], limit, offset, hasMore: false };
        }
        const matches = matchKnowledgeFilesByGlob(references.files, validatedRequest);
        return {
            files: matches.slice(offset, offset + limit),
            limit,
            offset,
            hasMore: matches.length > offset + limit,
        };
    }
    async readKnowledge(projectId, agentId, request) {
        const validatedRequest = (0, agent_knowledge_retrieval_1.parseReadKnowledgeRequest)(request);
        const references = await this.loadKnowledgeReferenceLookup(projectId, agentId);
        const file = this.resolveRequiredFile(validatedRequest, references);
        const command = (0, agent_knowledge_commands_1.buildReadKnowledgeCommand)(file.file, validatedRequest);
        const result = await this.executeKnowledgeOperation(projectId, agentId, command, references.files);
        assertKnowledgeFilesDirectoryAvailable('read', result);
        if (result.exitCode !== 0) {
            throw new n8n_workflow_1.OperationalError(formatSandboxCommandFailure('read', result));
        }
        const parsed = (0, agent_knowledge_commands_1.parseReadKnowledgeOutput)(result.stdout, file, validatedRequest);
        return {
            file: file.file,
            fileId: file.fileId,
            displayName: file.displayName,
            ranges: parsed.ranges,
            truncated: parsed.truncated,
        };
    }
    prewarmMirrorInBackground(projectId, agentId) {
        void (async () => {
            const references = await this.loadKnowledgeReferenceLookup(projectId, agentId);
            const runtime = await this.acquireKnowledgeRuntime(projectId, agentId);
            await this.ensureMirrorSynced(runtime, references.files);
        })().catch((error) => {
            this.logger.warn('Agent knowledge mirror pre-warm failed', {
                projectId,
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }
    async executeKnowledgeOperation(projectId, agentId, command, files) {
        const runtime = await this.acquireKnowledgeRuntime(projectId, agentId);
        const scopedCommand = (0, agent_knowledge_commands_1.buildScopedKnowledgeShellCommand)(command, runtime.paths);
        await this.ensureMirrorSynced(runtime, files);
        return await this.agentSandboxRuntimeService.executeSandboxCommand(runtime.sandbox, scopedCommand, this.agentsConfig.sandboxTimeout);
    }
    async ensureMirrorSynced(runtime, files) {
        await (0, run_serially_1.runSerially)(this.pendingMirrorSyncs, runtime.cacheKey, async () => await this.syncMirror(runtime, files));
    }
    async syncMirror(runtime, files) {
        const manifestResult = await this.agentSandboxRuntimeService.executeSandboxCommand(runtime.sandbox, `cat ${runtime.paths.manifest} 2>/dev/null || true`, agent_knowledge_commands_1.MIRROR_SYNC_TIMEOUT_SECONDS * 1000);
        const present = parseMirrorManifest(manifestResult.stdout);
        const expectedNames = files.map((file) => file.file);
        const expectedSet = new Set(expectedNames);
        const toCopy = files.filter((file) => present.get(file.file) !== file.fileId);
        const toDelete = [...present.keys()].filter((name) => !expectedSet.has(name));
        if (toCopy.length === 0 && toDelete.length === 0)
            return;
        for (const name of [...expectedNames, ...toDelete]) {
            (0, agent_knowledge_storage_1.assertKnowledgePathSegment)(name, 'knowledge mirror file name');
        }
        const stagingId = (0, nanoid_1.nanoid)();
        const stagingDir = `${runtime.paths.stagingDir}/${stagingId}`;
        try {
            await this.finalizeMirror(runtime, files, toCopy, toDelete, present, stagingId);
        }
        finally {
            if (toCopy.length > 0)
                await this.cleanMirrorStaging(runtime, stagingDir, stagingId);
        }
    }
    async uploadMirrorFiles(runtime, files, stagingId) {
        const copiedNames = new Set();
        if (files.length === 0)
            return copiedNames;
        const stagingDir = `${runtime.paths.stagingDir}/${stagingId}`;
        await runtime.filesystem.mkdir(stagingDir, { recursive: true });
        for (const file of files) {
            const name = file.file;
            let buffer;
            try {
                buffer = await this.agentKnowledgeFileStore.readAsBuffer({
                    storedAt: file.storedAt,
                    storageKey: file.storageKey,
                });
            }
            catch (error) {
                this.logger.warn('Failed to load agent knowledge file for mirror sync', {
                    sandboxName: runtime.cacheKey,
                    file: name,
                    error: error instanceof Error ? error.message : String(error),
                });
                continue;
            }
            if (!buffer) {
                this.logger.warn('Failed to load agent knowledge file for mirror sync', {
                    sandboxName: runtime.cacheKey,
                    file: name,
                    error: 'not found',
                });
                continue;
            }
            await runtime.filesystem.writeFile(`${stagingDir}/${name}`, buffer);
            copiedNames.add(name);
        }
        return copiedNames;
    }
    async loadKnowledgeReferenceLookup(projectId, agentId) {
        await this.assertKnowledgeAccess(projectId, agentId);
        const files = await this.loadKnowledgeFileReferences(agentId);
        return {
            files,
            byFile: new Map(files.map((file) => [file.file, file])),
            byId: new Map(files.map((file) => [file.fileId, file])),
        };
    }
    async loadKnowledgeFileReferences(agentId) {
        const files = await this.agentFileRepository.findByAgentId(agentId);
        return files.map((file) => ({
            file: (0, agent_knowledge_storage_1.storageFileNameForOriginalFileName)(file.fileName),
            fileId: file.id,
            storedAt: file.storedAt,
            storageKey: file.storageKey,
            displayName: file.fileName,
            mimeType: file.mimeType,
            fileSizeBytes: file.fileSizeBytes,
            createdAt: file.createdAt.toISOString(),
        }));
    }
    resolveRequiredFile(request, references) {
        const file = this.resolveOptionalFile(request, references);
        if (!file) {
            throw new errors_1.BadRequestError('Knowledge file not found');
        }
        return file;
    }
    resolveOptionalFile(request, references) {
        if (!request.file && !request.fileId)
            return undefined;
        if (request.file && request.fileId) {
            const normalized = (0, agent_knowledge_retrieval_1.assertValidKnowledgeFilePath)(request.file);
            const fileByPath = references.byFile.get(normalized);
            const fileById = references.byId.get(request.fileId);
            if (!fileByPath || !fileById || fileByPath.fileId !== fileById.fileId) {
                throw new errors_1.BadRequestError('Knowledge file not found');
            }
            return fileByPath;
        }
        if (request.file) {
            const normalized = (0, agent_knowledge_retrieval_1.assertValidKnowledgeFilePath)(request.file);
            const file = references.byFile.get(normalized);
            if (!file) {
                throw new errors_1.BadRequestError('Knowledge file not found');
            }
            return file;
        }
        const file = references.byId.get(request.fileId ?? '');
        if (!file) {
            throw new errors_1.BadRequestError('Knowledge file not found');
        }
        return file;
    }
    async assertKnowledgeAccess(projectId, agentId) {
        this.agentSandboxRuntimeService.assertSandboxConfiguration(projectId, agentId);
        const agentExists = await this.agentRepository.existsBy({ id: agentId, projectId });
        if (!agentExists) {
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        }
    }
    async acquireKnowledgeRuntime(projectId, agentId) {
        const runtime = await this.agentSandboxRuntimeService.acquireKnowledgeSandbox(projectId, agentId);
        return { ...runtime, paths: (0, agent_knowledge_storage_1.getAgentKnowledgePaths)(runtime.provider) };
    }
    resolveSearchFiles(request, references) {
        const scopedFilesByPath = new Map();
        for (const path of request.path ?? []) {
            const file = this.resolveOptionalFile({ file: path }, references);
            if (!file) {
                throw new errors_1.BadRequestError('Knowledge file not found');
            }
            scopedFilesByPath.set(file.file, file);
        }
        return [...scopedFilesByPath.values()];
    }
    parseSearchResult(stdout, validatedRequest, references, outputMode, limit) {
        if (outputMode === 'files_with_matches') {
            const parsed = (0, agent_knowledge_commands_1.parseRipgrepFilesOutput)(stdout, references.byFile);
            const files = parsed.files.slice(0, limit);
            return {
                outputMode,
                files,
                limit,
                hasMore: parsed.files.length > limit,
                truncated: parsed.incomplete,
            };
        }
        if (outputMode === 'count') {
            const parsed = (0, agent_knowledge_commands_1.parseRipgrepCountOutput)(stdout, references.byFile);
            const counts = parsed.counts.slice(0, limit);
            return {
                outputMode,
                counts,
                limit,
                hasMore: parsed.counts.length > limit,
                truncated: parsed.incomplete,
            };
        }
        const parsed = (0, agent_knowledge_commands_1.parseRipgrepOutput)(stdout, references.byFile, (0, agent_knowledge_commands_1.getSearchContextWindow)(validatedRequest));
        const matches = parsed.matches.slice(0, limit);
        return {
            outputMode,
            matches,
            limit,
            hasMore: parsed.matches.length > limit,
            truncated: parsed.incomplete,
        };
    }
    async finalizeMirror(runtime, files, toCopy, toDelete, present, stagingId) {
        const copiedNames = await this.uploadMirrorFiles(runtime, toCopy, stagingId);
        const finalManifestFiles = files.filter((file) => copiedNames.has(file.file) || present.get(file.file) === file.fileId);
        const staleFiles = toCopy
            .filter((file) => present.has(file.file) && !copiedNames.has(file.file))
            .map((file) => file.file);
        const syncResult = await this.agentSandboxRuntimeService.executeSandboxCommand(runtime.sandbox, (0, agent_knowledge_commands_1.buildMirrorFinalizeCommand)([...copiedNames], [...toDelete, ...staleFiles], finalManifestFiles, runtime.paths, stagingId), agent_knowledge_commands_1.MIRROR_SYNC_TIMEOUT_SECONDS * 1000);
        if (syncResult.exitCode !== 0) {
            throw new n8n_workflow_1.OperationalError(`Agent knowledge mirror sync failed: exitCode=${syncResult.exitCode}; output=${(0, agent_sandbox_runtime_service_1.sanitizeSandboxErrorDetail)(syncResult.stdout)}`);
        }
    }
    async cleanMirrorStaging(runtime, stagingDir, stagingId) {
        try {
            await runtime.filesystem.rmdir(stagingDir, { recursive: true, force: true });
        }
        catch (error) {
            this.logger.warn('Failed to clean agent knowledge mirror staging directory', {
                sandboxName: runtime.cacheKey,
                stagingId,
                error: (0, agent_sandbox_runtime_service_1.sanitizeSandboxErrorDetail)(error instanceof Error ? error.message : String(error)),
            });
        }
    }
};
exports.AgentKnowledgeMirrorService = AgentKnowledgeMirrorService;
exports.AgentKnowledgeMirrorService = AgentKnowledgeMirrorService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.AgentsConfig, backend_common_1.Logger, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService, agent_file_repository_1.AgentFileRepository, agent_repository_1.AgentRepository, agent_knowledge_file_store_1.AgentKnowledgeFileStore])
], AgentKnowledgeMirrorService);
function matchKnowledgeFilesByGlob(files, request) {
    const caseSensitive = request.caseSensitive === true;
    const source = globPatternToRegexSource(request.pattern);
    const flags = caseSensitive ? undefined : 'i';
    const patternTokens = tokenizeKnowledgeFilePattern(request.pattern, caseSensitive);
    const deadline = performance.now() + GLOB_MATCH_TIMEOUT_MS;
    const matchesGlob = (fileName) => {
        if (performance.now() >= deadline) {
            throw new Error('Regular expression execution timed out');
        }
        const matches = n8n_workflow_1.safeRegex.test(source, fileName, flags);
        if (performance.now() >= deadline) {
            throw new Error('Regular expression execution timed out');
        }
        return matches;
    };
    return files
        .filter((file) => matchesGlob(file.file) || matchesGlob(file.displayName))
        .map((file) => ({
        file,
        bucket: getKnowledgeFileMatchBucket(file, patternTokens, caseSensitive),
    }))
        .sort((left, right) => left.bucket - right.bucket || left.file.displayName.localeCompare(right.file.displayName))
        .map(({ file }) => file);
}
function getKnowledgeFileMatchBucket(file, patternTokens, caseSensitive) {
    const fileNames = [file.file, file.displayName];
    if (fileNames.some((fileName) => hasExactTokenMatch(tokenizeKnowledgeFileName(fileName, caseSensitive), patternTokens))) {
        return 0;
    }
    if (fileNames.some((fileName) => containsTokenSequence(tokenizeKnowledgeFileName(fileName, caseSensitive), patternTokens))) {
        return 1;
    }
    const compactPattern = patternTokens.join('');
    if (compactPattern &&
        fileNames.some((fileName) => compactKnowledgeFileName(fileName, caseSensitive).includes(compactPattern))) {
        return 2;
    }
    return 3;
}
function tokenizeKnowledgeFilePattern(pattern, caseSensitive) {
    return tokenizeKnowledgeFileName(pattern.replace(/[*?]/g, ' '), caseSensitive);
}
function tokenizeKnowledgeFileName(fileName, caseSensitive) {
    const normalized = caseSensitive ? fileName : fileName.toLowerCase();
    const baseName = normalized
        .split(/[\\/]/)
        .at(-1)
        ?.replace(/\.[^.]*$/, '') ?? normalized;
    return baseName.split(/[^a-z0-9]+/i).filter(Boolean);
}
function compactKnowledgeFileName(fileName, caseSensitive) {
    return tokenizeKnowledgeFileName(fileName, caseSensitive).join('');
}
function hasExactTokenMatch(fileTokens, patternTokens) {
    return (patternTokens.length > 0 &&
        fileTokens.length === patternTokens.length &&
        fileTokens.every((fileToken, index) => fileToken === patternTokens[index]));
}
function containsTokenSequence(fileTokens, patternTokens) {
    if (patternTokens.length === 0)
        return false;
    let patternIndex = 0;
    for (const fileToken of fileTokens) {
        if (fileToken !== patternTokens[patternIndex])
            continue;
        patternIndex++;
        if (patternIndex === patternTokens.length)
            return true;
    }
    return false;
}
function globPatternToRegexSource(pattern) {
    let source = '^';
    for (const character of pattern) {
        if (character === '*') {
            source += '.*';
            continue;
        }
        if (character === '?') {
            source += '.';
            continue;
        }
        source += (0, escapeRegExp_1.default)(character);
    }
    source += '$';
    return source;
}
//# sourceMappingURL=agent-knowledge-mirror.service.js.map