"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeapDiagnosticsService = void 0;
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_v8_1 = require("node:v8");
let HeapDiagnosticsService = class HeapDiagnosticsService {
    constructor() {
        this.snapshotPaths = new Map();
    }
    collectGarbage() {
        if (typeof global.gc !== 'function') {
            return {
                success: false,
                message: 'Garbage collection not available. Ensure Node.js is started with --expose-gc flag.',
            };
        }
        global.gc();
        global.gc();
        return { success: true, message: 'Garbage collection triggered' };
    }
    writeHeapSnapshot() {
        this.collectGarbage();
        const filePath = (0, node_v8_1.writeHeapSnapshot)();
        if (!filePath)
            return { success: false, message: 'Failed to write heap snapshot' };
        const fullPath = (0, node_path_1.resolve)(filePath);
        const filename = (0, node_path_1.basename)(fullPath);
        const { size } = (0, node_fs_1.statSync)(fullPath);
        this.snapshotPaths.set(filename, fullPath);
        return {
            success: true,
            filePath: filename,
            sizeBytes: size,
            sizeMB: Math.round(size / 1024 / 1024),
        };
    }
    openHeapSnapshot(requestedFilename) {
        const filename = (0, node_path_1.basename)(requestedFilename);
        if (!filename.endsWith('.heapsnapshot'))
            throw new errors_1.BadRequestError('Invalid file type');
        const fullPath = this.snapshotPaths.get(filename) ?? (0, node_path_1.resolve)(filename);
        if (!(0, node_fs_1.existsSync)(fullPath))
            throw new errors_1.NotFoundError(`Snapshot not found: ${filename}`);
        return (0, node_fs_1.createReadStream)(fullPath);
    }
};
exports.HeapDiagnosticsService = HeapDiagnosticsService;
exports.HeapDiagnosticsService = HeapDiagnosticsService = __decorate([
    (0, di_1.Service)()
], HeapDiagnosticsService);
//# sourceMappingURL=heap-diagnostics.service.js.map