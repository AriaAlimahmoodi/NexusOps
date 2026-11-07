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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentKnowledgeFileStore = void 0;
const backend_network_1 = require("@n8n/backend-network");
const blob_storage_1 = require("@n8n/blob-storage");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const uuid_1 = require("uuid");
const LEGACY_KEY_SEGMENT = '/binary_data/';
let AgentKnowledgeFileStore = class AgentKnowledgeFileStore {
    constructor(fsByteStore, storageConfig, binaryDataRepository, errorReporter) {
        this.storageConfig = storageConfig;
        this.binaryDataRepository = binaryDataRepository;
        this.errorReporter = errorReporter;
        this.byteStores = new blob_storage_1.ByteStoreRegistry({ fs: fsByteStore });
    }
    registerByteStore(loc, store) {
        this.byteStores.register(loc, store);
    }
    async write(ref, body, metadata) {
        const storedAt = this.storageConfig.modeTag;
        if (storedAt === 'db') {
            const buffer = await (0, backend_network_1.binaryToBuffer)(body);
            const storageKey = (0, uuid_1.v4)();
            await this.binaryDataRepository.insert({
                fileId: storageKey,
                sourceType: 'agent_file',
                sourceId: ref.fileId,
                data: buffer,
                mimeType: metadata.mimeType ?? null,
                fileName: metadata.fileName ?? null,
                fileSize: buffer.length,
            });
            return { storedAt, storageKey };
        }
        const storageKey = this.newKeyFor(ref);
        await this.byteStores.get(storedAt).write(storageKey, body, metadata);
        return { storedAt, storageKey };
    }
    async readAsBuffer(file) {
        if (file.storedAt === 'db') {
            return await this.binaryDataRepository.findContentByFileId(file.storageKey);
        }
        return await this.byteStores.get(file.storedAt).read(file.storageKey);
    }
    async delete(files) {
        if (files.length === 0)
            return;
        const groups = new Map();
        for (const file of files) {
            const group = groups.get(file.storedAt) ?? [];
            group.push(file);
            groups.set(file.storedAt, group);
        }
        await Promise.all([...groups].map(async ([loc, group]) => {
            if (loc === 'db') {
                await this.binaryDataRepository.deleteByFileIds(group.map((file) => file.storageKey));
                return;
            }
            const store = this.byteStores.find(loc);
            if (!store) {
                this.errorReporter.error(new blob_storage_1.SkippedEntryDeletionError(loc, group.length));
                return;
            }
            await store.delete(this.keysToDelete(loc, group));
        }));
    }
    keysToDelete(loc, files) {
        if (loc !== 'fs')
            return files.map((file) => file.storageKey);
        return files.flatMap((file) => file.storageKey.includes(LEGACY_KEY_SEGMENT)
            ? [file.storageKey, `${file.storageKey}.metadata`]
            : [file.storageKey]);
    }
    newKeyFor(ref) {
        return [
            'agents',
            encodeURIComponent(ref.agentId),
            'knowledge-files',
            encodeURIComponent(ref.fileId),
            'content',
        ].join('/');
    }
};
exports.AgentKnowledgeFileStore = AgentKnowledgeFileStore;
exports.AgentKnowledgeFileStore = AgentKnowledgeFileStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.FsByteStoreService, n8n_core_1.StorageConfig, db_1.BinaryDataRepository, n8n_core_1.ErrorReporter])
], AgentKnowledgeFileStore);
//# sourceMappingURL=agent-knowledge-file-store.js.map