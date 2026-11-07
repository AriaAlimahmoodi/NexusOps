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
exports.NodeToolAiGatewayService = void 0;
const di_1 = require("@n8n/di");
const node_types_1 = require("../../../node-types");
const ai_gateway_service_1 = require("../../../services/ai-gateway.service");
const reconcile_node_tool_gateway_credentials_1 = require("./reconcile-node-tool-gateway-credentials");
let NodeToolAiGatewayService = class NodeToolAiGatewayService {
    constructor(nodeTypes, aiGatewayService) {
        this.nodeTypes = nodeTypes;
        this.aiGatewayService = aiGatewayService;
    }
    async assignManagedCredentials(tools, ownedCredentialTypes) {
        if (tools === undefined)
            return;
        const availability = await this.aiGatewayService.isAvailable();
        (0, reconcile_node_tool_gateway_credentials_1.reconcileNodeToolGatewayCredentials)(tools, this.nodeTypes, availability.available ? availability.config : undefined, ownedCredentialTypes);
    }
};
exports.NodeToolAiGatewayService = NodeToolAiGatewayService;
exports.NodeToolAiGatewayService = NodeToolAiGatewayService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [node_types_1.NodeTypes, ai_gateway_service_1.AiGatewayService])
], NodeToolAiGatewayService);
//# sourceMappingURL=node-tool-ai-gateway.service.js.map