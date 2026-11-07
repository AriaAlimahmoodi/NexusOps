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
exports.InstanceAiGatewayService = exports.BROWSER_TOOL_CATEGORY = void 0;
const di_1 = require("@n8n/di");
const telemetry_1 = require("../../telemetry");
const filesystem_1 = require("./filesystem");
const instance_ai_settings_service_1 = require("./instance-ai-settings.service");
exports.BROWSER_TOOL_CATEGORY = 'browser';
let InstanceAiGatewayService = class InstanceAiGatewayService {
    constructor(telemetry, settingsService) {
        this.telemetry = telemetry;
        this.settingsService = settingsService;
        this.registry = new filesystem_1.LocalGatewayRegistry();
    }
    applyToolPolicy(userId) {
        this.findGateway(userId)?.setExcludedToolCategories(this.settingsService.isBrowserUseEnabled() ? [] : [exports.BROWSER_TOOL_CATEGORY]);
    }
    getUserIdForApiKey(key) {
        return this.registry.getUserIdForApiKey(key);
    }
    generatePairingToken(userId) {
        return this.registry.generatePairingToken(userId);
    }
    getGatewayApiKeyExpiresAt(userId, key) {
        return this.registry.getApiKeyExpiresAt(userId, key);
    }
    getPairingToken(userId) {
        return this.registry.getPairingToken(userId);
    }
    consumePairingToken(userId, token) {
        return this.registry.consumePairingToken(userId, token);
    }
    getActiveSessionKey(userId) {
        return this.registry.getActiveSessionKey(userId);
    }
    clearActiveSessionKey(userId) {
        this.registry.clearActiveSessionKey(userId);
    }
    getLocalGateway(userId) {
        return this.registry.getGateway(userId);
    }
    findGateway(userId) {
        return this.registry.findGateway(userId);
    }
    initGateway(userId, data) {
        this.registry.initGateway(userId, data);
        this.telemetry.track('User connected to Computer Use', {
            user_id: userId,
            tool_groups: data.toolCategories.filter((c) => c.enabled).map((c) => c.name),
        });
    }
    resolveGatewayRequest(userId, requestId, result, error) {
        return this.registry.resolveGatewayRequest(userId, requestId, result, error);
    }
    disconnectGateway(userId) {
        this.registry.disconnectGateway(userId);
    }
    disconnectAllGateways() {
        const connectedUserIds = this.registry.getConnectedUserIds();
        this.registry.disconnectAll();
        return connectedUserIds;
    }
    disconnectAll() {
        this.registry.disconnectAll();
    }
    getGatewayStatus(userId) {
        return this.registry.getGatewayStatus(userId);
    }
    startDisconnectTimer(userId, onDisconnect) {
        this.registry.startDisconnectTimer(userId, onDisconnect);
    }
    clearDisconnectTimer(userId) {
        this.registry.clearDisconnectTimer(userId);
    }
};
exports.InstanceAiGatewayService = InstanceAiGatewayService;
exports.InstanceAiGatewayService = InstanceAiGatewayService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [telemetry_1.Telemetry, instance_ai_settings_service_1.InstanceAiSettingsService])
], InstanceAiGatewayService);
//# sourceMappingURL=instance-ai-gateway.service.js.map