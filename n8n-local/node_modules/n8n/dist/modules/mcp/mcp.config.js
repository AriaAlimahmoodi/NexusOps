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
exports.McpConfig = void 0;
const config_1 = require("@n8n/config");
const zod_1 = require("zod");
const baseUrlSchema = zod_1.z
    .string()
    .refine((value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}, { message: 'Must be a valid http(s) URL' })
    .transform((value) => {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.replace(/\/$/, '');
});
let McpConfig = class McpConfig {
    constructor() {
        this.rateLimitServer = 100;
        this.baseUrl = '';
        this.communityNodeDiscoveryEnabled = true;
    }
};
exports.McpConfig = McpConfig;
__decorate([
    (0, config_1.Env)('N8N_MCP_SERVER_RATE_LIMIT', zod_1.z.number({ coerce: true }).int().nonnegative()),
    __metadata("design:type", Number)
], McpConfig.prototype, "rateLimitServer", void 0);
__decorate([
    (0, config_1.Env)('N8N_MCP_BASE_URL', baseUrlSchema),
    __metadata("design:type", String)
], McpConfig.prototype, "baseUrl", void 0);
__decorate([
    (0, config_1.Env)('N8N_MCP_COMMUNITY_NODE_DISCOVERY_ENABLED'),
    __metadata("design:type", Boolean)
], McpConfig.prototype, "communityNodeDiscoveryEnabled", void 0);
exports.McpConfig = McpConfig = __decorate([
    config_1.Config
], McpConfig);
//# sourceMappingURL=mcp.config.js.map