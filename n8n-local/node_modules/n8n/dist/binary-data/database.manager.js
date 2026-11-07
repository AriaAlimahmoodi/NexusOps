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
exports.DatabaseManager = void 0;
const backend_network_1 = require("@n8n/backend-network");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const promises_1 = require("node:fs/promises");
const node_stream_1 = require("node:stream");
const uuid_1 = require("uuid");
let DatabaseManager = class DatabaseManager {
    constructor(repository, config) {
        this.repository = repository;
        this.config = config;
    }
    async init() {
    }
    async store(location, bufferOrStream, metadata) {
        const buffer = await (0, backend_network_1.binaryToBuffer)(bufferOrStream);
        const fileSizeBytes = buffer.length;
        const fileSizeMb = fileSizeBytes / (1024 * 1024);
        const fileId = (0, uuid_1.v4)();
        if (fileSizeMb > this.config.dbMaxFileSize) {
            throw new n8n_core_1.FileTooLargeError({
                fileSizeMb,
                maxFileSizeMb: this.config.dbMaxFileSize,
                fileId,
                fileName: metadata.fileName,
            });
        }
        const { sourceType, sourceId } = this.toSource(location);
        await this.repository.insert({
            fileId,
            sourceType,
            sourceId,
            data: buffer,
            mimeType: metadata.mimeType ?? null,
            fileName: metadata.fileName ?? null,
            fileSize: fileSizeBytes,
        });
        return { fileId, fileSize: fileSizeBytes };
    }
    getPath(fileId) {
        return `database://${fileId}`;
    }
    async getAsBuffer(fileId) {
        const file = await this.repository.findOneOrFail({
            where: { fileId },
            select: ['data'],
        });
        return file.data;
    }
    async getAsStream(fileId) {
        const buffer = await this.getAsBuffer(fileId);
        return node_stream_1.Readable.from(buffer);
    }
    async getMetadata(fileId) {
        const file = await this.repository.findOneOrFail({
            where: { fileId },
            select: ['fileName', 'mimeType', 'fileSize'],
        });
        return {
            fileName: file.fileName ?? undefined,
            mimeType: file.mimeType ?? undefined,
            fileSize: file.fileSize,
        };
    }
    async deleteMany(locations) {
        if (locations.length === 0)
            return;
        const executionIds = locations.flatMap((location) => location.type === 'execution' ? [location.executionId] : []);
        if (executionIds.length === 0)
            return;
        await this.repository.delete({ sourceType: 'execution', sourceId: (0, db_1.In)(executionIds) });
    }
    async deleteManyByFileId(ids) {
        if (ids.length === 0)
            return;
        await this.repository.delete({ fileId: (0, db_1.In)(ids) });
    }
    async copyByFileId(targetLocation, sourceFileId) {
        const targetFileId = (0, uuid_1.v4)();
        const { sourceType, sourceId } = this.toSource(targetLocation);
        const success = await this.repository.copyStoredFile(sourceFileId, targetFileId, sourceType, sourceId);
        if (!success)
            throw new n8n_core_1.BinaryDataFileNotFoundError(sourceFileId);
        return targetFileId;
    }
    async copyByFilePath(targetLocation, sourcePath, metadata) {
        const fileId = (0, uuid_1.v4)();
        const buffer = await (0, promises_1.readFile)(sourcePath);
        const fileSizeBytes = buffer.length;
        const fileSizeMb = fileSizeBytes / (1024 * 1024);
        if (fileSizeMb > this.config.dbMaxFileSize) {
            throw new n8n_core_1.FileTooLargeError({
                fileSizeMb,
                maxFileSizeMb: this.config.dbMaxFileSize,
                fileId,
                fileName: metadata.fileName,
            });
        }
        const { sourceType, sourceId } = this.toSource(targetLocation);
        await this.repository.insert({
            fileId,
            sourceType,
            sourceId,
            data: buffer,
            mimeType: metadata.mimeType ?? null,
            fileName: metadata.fileName ?? null,
            fileSize: fileSizeBytes,
        });
        return { fileId, fileSize: fileSizeBytes };
    }
    async rename(oldFileId, newFileId) {
        const result = await this.repository.update({ fileId: oldFileId }, { fileId: newFileId });
        if (result.affected === 0)
            throw new n8n_core_1.BinaryDataFileNotFoundError(oldFileId);
    }
    toSource(location) {
        if (location.type === 'execution') {
            return {
                sourceType: 'execution',
                sourceId: location.executionId || n8n_core_1.TEMP_EXECUTION_ID,
            };
        }
        if (typeof location.sourceId !== 'string') {
            throw new n8n_core_1.MissingSourceIdError(location.pathSegments);
        }
        const validationResult = db_1.SourceTypeSchema.safeParse(location.sourceType);
        if (!validationResult.success) {
            throw new n8n_core_1.InvalidSourceTypeError(location.sourceType ?? 'unknown');
        }
        return {
            sourceType: validationResult.data,
            sourceId: location.sourceId,
        };
    }
};
exports.DatabaseManager = DatabaseManager;
exports.DatabaseManager = DatabaseManager = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.BinaryDataRepository, n8n_core_1.BinaryDataConfig])
], DatabaseManager);
//# sourceMappingURL=database.manager.js.map