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
exports.PackageImportConfig = void 0;
const config_1 = require("@n8n/config");
const MiB = 1024 * 1024;
let PackageImportConfig = class PackageImportConfig {
    constructor() {
        this.maxUncompressedBytes = 300 * MiB;
        this.maxEntryBytes = 5 * MiB;
        this.maxEntries = 5_000;
        this.maxPathLength = 1024;
    }
};
exports.PackageImportConfig = PackageImportConfig;
__decorate([
    (0, config_1.Env)('N8N_IMPORT_MAX_UNCOMPRESSED_BYTES'),
    __metadata("design:type", Number)
], PackageImportConfig.prototype, "maxUncompressedBytes", void 0);
__decorate([
    (0, config_1.Env)('N8N_IMPORT_MAX_ENTRY_BYTES'),
    __metadata("design:type", Number)
], PackageImportConfig.prototype, "maxEntryBytes", void 0);
__decorate([
    (0, config_1.Env)('N8N_IMPORT_MAX_ENTRIES'),
    __metadata("design:type", Number)
], PackageImportConfig.prototype, "maxEntries", void 0);
__decorate([
    (0, config_1.Env)('N8N_IMPORT_MAX_PATH_LENGTH'),
    __metadata("design:type", Number)
], PackageImportConfig.prototype, "maxPathLength", void 0);
exports.PackageImportConfig = PackageImportConfig = __decorate([
    config_1.Config
], PackageImportConfig);
//# sourceMappingURL=n8n-packages.config.js.map