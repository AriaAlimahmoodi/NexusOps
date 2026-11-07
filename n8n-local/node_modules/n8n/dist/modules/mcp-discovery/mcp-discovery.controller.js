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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpDiscoveryController = void 0;
const mcp_discovery_dto_1 = require("./mcp-discovery.dto");
const decorators_1 = require("@n8n/decorators");
const enrollment_service_1 = require("./enrollment.service");
let McpDiscoveryController = class McpDiscoveryController {
    constructor(enrollment) {
        this.enrollment = enrollment;
    }
    async visit(req, _, payload) {
        return await this.enrollment.visit(req.user, payload);
    }
};
exports.McpDiscoveryController = McpDiscoveryController;
__decorate([
    (0, decorators_1.Post)('/visit'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, mcp_discovery_dto_1.McpDiscoveryVisitRequestDto]),
    __metadata("design:returntype", Promise)
], McpDiscoveryController.prototype, "visit", null);
exports.McpDiscoveryController = McpDiscoveryController = __decorate([
    (0, decorators_1.RestController)('/me/mcp-discovery'),
    __metadata("design:paramtypes", [enrollment_service_1.McpDiscoveryEnrollmentService])
], McpDiscoveryController);
//# sourceMappingURL=mcp-discovery.controller.js.map