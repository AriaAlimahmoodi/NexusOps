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
exports.EngineV2PayloadFiles = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const isStored = (ref) => ref.id !== undefined;
let EngineV2PayloadFiles = class EngineV2PayloadFiles {
    constructor(binaryDataService, logger) {
        this.binaryDataService = binaryDataService;
        this.logger = logger;
    }
    async claimForExecution(slots, executionId) {
        const temporarySegment = `/${n8n_core_1.TEMP_EXECUTION_ID}/`;
        const refsByFileId = new Map();
        for (const file of this.storedFilesIn(slots)) {
            if (!file.fileId.includes(temporarySegment))
                continue;
            refsByFileId.set(file.fileId, [...(refsByFileId.get(file.fileId) ?? []), file]);
        }
        const executionSegment = `/${executionId}/`;
        const moves = await Promise.allSettled([...refsByFileId].map(async ([fileId, refs]) => {
            await this.binaryDataService.rename(fileId, fileId.replace(temporarySegment, executionSegment));
            for (const { ref } of refs)
                ref.id = ref.id.replace(temporarySegment, executionSegment);
        }));
        const failed = moves.find((move) => move.status === 'rejected');
        if (failed)
            throw failed.reason;
    }
    async discard(slots) {
        const ids = this.storedFilesIn(slots).map(({ ref }) => ref.id);
        if (ids.length === 0)
            return;
        try {
            await this.binaryDataService.deleteManyByBinaryDataId(ids);
        }
        catch (error) {
            this.logger.error('Failed to delete the files of an engine v2 payload that did not run', {
                error,
            });
        }
    }
    storedFilesIn(slots) {
        return slots
            .flatMap((slot) => slot ?? [])
            .flatMap((item) => Object.values(item.binary ?? {}))
            .filter(isStored)
            .flatMap((ref) => {
            const [, fileId] = ref.id.split(':');
            return fileId ? [{ ref, fileId }] : [];
        });
    }
};
exports.EngineV2PayloadFiles = EngineV2PayloadFiles;
exports.EngineV2PayloadFiles = EngineV2PayloadFiles = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.BinaryDataService, backend_common_1.Logger])
], EngineV2PayloadFiles);
//# sourceMappingURL=engine-v2-payload-files.service.js.map