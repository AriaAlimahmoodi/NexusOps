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
exports.AgentKnowledgeService = void 0;
const api_types_1 = require("@n8n/api-types");
const ai_utilities_1 = require("@n8n/ai-utilities");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const errors_1 = require("@n8n/errors");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const agent_knowledge_file_store_1 = require("./agent-knowledge-file-store");
const agent_knowledge_mirror_service_1 = require("./agent-knowledge-mirror.service");
const agent_knowledge_storage_1 = require("./agent-knowledge-storage");
const agent_sandbox_runtime_service_1 = require("./agent-sandbox-runtime.service");
const agent_file_repository_1 = require("./repositories/agent-file.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const MAX_AGENT_FILE_METADATA_LENGTH = 255;
let AgentKnowledgeService = class AgentKnowledgeService {
    constructor(agentRepository, agentFileRepository, agentSandboxRuntimeService, agentKnowledgeMirrorService, agentKnowledgeFileStore, logger) {
        this.agentRepository = agentRepository;
        this.agentFileRepository = agentFileRepository;
        this.agentSandboxRuntimeService = agentSandboxRuntimeService;
        this.agentKnowledgeMirrorService = agentKnowledgeMirrorService;
        this.agentKnowledgeFileStore = agentKnowledgeFileStore;
        this.logger = logger;
    }
    async uploadFiles(agentId, projectId, files) {
        try {
            await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
            this.validateUploadMetadata(files);
            await this.validateUploadBatch(agentId, files);
            const uploadedFiles = [];
            try {
                for (const file of files) {
                    uploadedFiles.push(await this.storeAgentFile(agentId, file));
                }
            }
            catch (error) {
                await this.cleanupUploadedFiles(uploadedFiles);
                throw error;
            }
            this.agentKnowledgeMirrorService.prewarmMirrorInBackground(projectId, agentId);
            return uploadedFiles.map((file) => (0, agent_knowledge_storage_1.toAgentFileDto)(file));
        }
        finally {
            await this.cleanupUploadTempFiles(files);
        }
    }
    async listFiles(agentId, projectId) {
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const files = await this.agentFileRepository.findByAgentId(agentId);
        return files.map((file) => (0, agent_knowledge_storage_1.toAgentFileDto)(file));
    }
    async warmKnowledgeSandbox(agentId, projectId) {
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        if (!(await this.agentFileRepository.hasFilesForAgent(agentId)))
            return;
        await this.agentSandboxRuntimeService.warmKnowledgeSandbox(projectId, agentId);
    }
    async deleteFile(agentId, projectId, fileId) {
        await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const file = await this.agentFileRepository.findByIdAndAgentId(fileId, agentId);
        if (!file) {
            return;
        }
        await this.agentFileRepository.delete({ id: fileId, agentId });
        await this.agentKnowledgeFileStore
            .delete([{ storedAt: file.storedAt, storageKey: file.storageKey }])
            .catch((error) => {
            this.logger.warn('Failed to delete knowledge file blob', {
                agentId,
                fileId: file.id,
                error: error instanceof Error ? error.message : error,
            });
        });
        if (await this.agentFileRepository.hasFilesForAgent(agentId)) {
            this.agentKnowledgeMirrorService.prewarmMirrorInBackground(projectId, agentId);
        }
        else {
            await this.agentSandboxRuntimeService.destroyKnowledgeSandbox(projectId, agentId);
        }
    }
    async deleteAllFilesForAgent(_projectId, agentId) {
        const files = await this.agentFileRepository.findByAgentId(agentId);
        await this.agentFileRepository.delete({ agentId });
        if (files.length > 0) {
            await this.agentKnowledgeFileStore
                .delete(files.map((file) => ({
                storedAt: file.storedAt,
                storageKey: file.storageKey,
            })))
                .catch((error) => {
                this.logger.warn('Failed to delete knowledge file blobs', {
                    agentId,
                    error: error instanceof Error ? error.message : error,
                });
            });
        }
    }
    async destroyKnowledgeSandbox(projectId, agentId) {
        await this.agentSandboxRuntimeService.destroyKnowledgeSandbox(projectId, agentId);
    }
    async storeAgentFile(agentId, file) {
        const fileId = (0, generate_nano_id_1.generateNanoId)();
        const storageFileName = (0, agent_knowledge_storage_1.storageFileNameForOriginalFileName)(file.originalname);
        const content = await this.prepareUploadContent(file);
        const stored = await this.agentKnowledgeFileStore.write({ agentId, fileId }, content, {
            fileName: storageFileName,
            mimeType: file.mimetype,
        });
        try {
            return await this.saveAgentFile(agentId, fileId, file, stored);
        }
        catch (error) {
            await this.agentKnowledgeFileStore.delete([stored]).catch(() => { });
            if ((0, db_1.isUniqueConstraintError)(error)) {
                throw this.duplicateFileNameError(file.originalname);
            }
            throw error;
        }
    }
    async saveAgentFile(agentId, fileId, file, stored) {
        const agentFile = this.agentFileRepository.create({
            id: fileId,
            agentId,
            storedAt: stored.storedAt,
            storageKey: stored.storageKey,
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
        });
        return await this.agentFileRepository.save(agentFile);
    }
    async prepareUploadContent(file) {
        if (!file.path) {
            throw new errors_1.BadRequestError('Uploaded file path is missing');
        }
        const extension = node_path_1.default.extname(file.originalname).toLowerCase();
        if (extension === '.pdf') {
            const extractedText = await this.extractPdfText(file.path);
            return Buffer.from(extractedText, 'utf-8');
        }
        return (0, node_fs_1.createReadStream)(file.path);
    }
    async cleanupUploadedFiles(files) {
        for (const file of files) {
            await this.agentKnowledgeFileStore
                .delete([{ storedAt: file.storedAt, storageKey: file.storageKey }])
                .catch(() => { });
            await this.agentFileRepository.delete({ id: file.id, agentId: file.agentId }).catch(() => { });
        }
    }
    async extractPdfText(filePath) {
        const loader = new ai_utilities_1.N8nPdfLoader(filePath, { splitPages: false });
        const documents = await loader.load();
        const extractedText = documents
            .map((document) => document.pageContent)
            .join('\n\n')
            .replaceAll('\u0000', '')
            .trim();
        if (!extractedText) {
            throw new errors_1.BadRequestError('PDF contains no extractable text and cannot be added to knowledge');
        }
        return extractedText;
    }
    validateUploadMetadata(files) {
        for (const file of files) {
            this.validateMetadataLength('File name', file.originalname);
            this.validateMetadataLength('MIME type', file.mimetype);
        }
    }
    async validateUploadBatch(agentId, files) {
        const existingFiles = await this.agentFileRepository.findByAgentId(agentId);
        const existingTotalSizeBytes = existingFiles.reduce((total, file) => total + file.fileSizeBytes, 0);
        const uploadTotalSizeBytes = files.reduce((total, file) => total + file.size, 0);
        if (existingTotalSizeBytes + uploadTotalSizeBytes > api_types_1.MAX_AGENT_KNOWLEDGE_BASE_SIZE_BYTES) {
            throw new errors_1.BadRequestError(`Knowledge base limit reached. The total size can't be larger than ${api_types_1.MAX_AGENT_KNOWLEDGE_BASE_SIZE_GB} GB.`);
        }
        const existingFileNames = new Set(existingFiles.map((file) => file.fileName));
        const existingStorageNames = new Set(existingFiles.map((file) => (0, agent_knowledge_storage_1.storageFileNameForOriginalFileName)(file.fileName)));
        const batchFileNames = new Set();
        const batchStorageNames = new Set();
        for (const file of files) {
            if (batchFileNames.has(file.originalname)) {
                throw this.duplicateFileNameError(file.originalname);
            }
            batchFileNames.add(file.originalname);
            if (existingFileNames.has(file.originalname)) {
                throw this.duplicateFileNameError(file.originalname);
            }
            const storageFileName = (0, agent_knowledge_storage_1.storageFileNameForOriginalFileName)(file.originalname);
            if (batchStorageNames.has(storageFileName)) {
                throw this.duplicateFileNameError(file.originalname);
            }
            batchStorageNames.add(storageFileName);
            if (existingStorageNames.has(storageFileName)) {
                throw this.duplicateFileNameError(file.originalname);
            }
        }
    }
    duplicateFileNameError(fileName) {
        return new errors_1.BadRequestError(`A knowledge file named "${fileName}" already exists for this agent`);
    }
    validateMetadataLength(label, value) {
        if (value.length > MAX_AGENT_FILE_METADATA_LENGTH) {
            throw new errors_1.BadRequestError(`${label} must be ${MAX_AGENT_FILE_METADATA_LENGTH} characters or less`);
        }
    }
    async cleanupUploadTempFiles(files) {
        await Promise.all(files.map(async (file) => await this.cleanupUploadTempFile(file)));
    }
    async cleanupUploadTempFile(file) {
        if (!file.path)
            return;
        await (0, promises_1.unlink)(file.path).catch(() => { });
    }
};
exports.AgentKnowledgeService = AgentKnowledgeService;
exports.AgentKnowledgeService = AgentKnowledgeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository, agent_file_repository_1.AgentFileRepository, agent_sandbox_runtime_service_1.AgentSandboxRuntimeService, agent_knowledge_mirror_service_1.AgentKnowledgeMirrorService, agent_knowledge_file_store_1.AgentKnowledgeFileStore, backend_common_1.Logger])
], AgentKnowledgeService);
//# sourceMappingURL=agent-knowledge.service.js.map