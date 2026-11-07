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
exports.ExecutionDataJsonStore = void 0;
const blob_storage_1 = require("@n8n/blob-storage");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const constants_1 = require("./constants");
const corrupted_execution_data_error_1 = require("./corrupted-execution-data.error");
const execution_data_write_error_1 = require("./execution-data-write.error");
let ExecutionDataJsonStore = class ExecutionDataJsonStore extends blob_storage_1.JsonStore {
    constructor(fsByteStore, errorReporter) {
        super({
            byteStores: { fs: fsByteStore },
            version: constants_1.EXECUTION_DATA_BUNDLE_VERSION,
            key: ({ workflowId, executionId }) => [
                'workflows',
                workflowId,
                'executions',
                executionId,
                'execution_data',
                constants_1.EXECUTION_DATA_BUNDLE_FILENAME,
            ].join('/'),
            getId: (ref) => ref.executionId,
            createWriteError: (ref, cause) => new execution_data_write_error_1.ExecutionDataWriteError(ref, cause),
            createCorruptedError: (ref, cause) => new corrupted_execution_data_error_1.CorruptedExecutionDataError(ref, cause),
            reportError: (error) => errorReporter.error(error),
        });
    }
};
exports.ExecutionDataJsonStore = ExecutionDataJsonStore;
exports.ExecutionDataJsonStore = ExecutionDataJsonStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.FsByteStoreService, n8n_core_1.ErrorReporter])
], ExecutionDataJsonStore);
//# sourceMappingURL=execution-data-json-store.js.map