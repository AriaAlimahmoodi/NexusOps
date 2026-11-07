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
exports.McpRegistryRefreshTask = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const mcp_registry_service_1 = require("./registry/mcp-registry.service");
const REFRESH_INTERVAL_HOURS = 8;
let McpRegistryRefreshTask = class McpRegistryRefreshTask {
    constructor(mcpRegistryService) {
        this.mcpRegistryService = mcpRegistryService;
        this.name = 'mcp-registry-refresh';
        this.schedule = (0, decorators_1.intervalFromSeconds)(REFRESH_INTERVAL_HOURS * constants_1.Time.hours.toSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: { retryOnFailure: true },
            leaderTimer: { runOnTakeover: true },
        });
    }
    async run(signal) {
        await this.mcpRegistryService.refreshFromApi(signal);
    }
};
exports.McpRegistryRefreshTask = McpRegistryRefreshTask;
exports.McpRegistryRefreshTask = McpRegistryRefreshTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [mcp_registry_service_1.McpRegistryService])
], McpRegistryRefreshTask);
//# sourceMappingURL=mcp-registry-refresh.task.js.map