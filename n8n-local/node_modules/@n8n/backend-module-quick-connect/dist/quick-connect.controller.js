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
exports.QuickConnectController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const quick_connect_service_1 = require("./quick-connect.service");
let QuickConnectController = class QuickConnectController {
    constructor(quickConnectService) {
        this.quickConnectService = quickConnectService;
    }
    async getCredentialData(req, _res, body) {
        return await this.quickConnectService.getCredentialData(body.quickConnectType, req.user);
    }
};
exports.QuickConnectController = QuickConnectController;
__decorate([
    (0, decorators_1.Post)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GetQuickConnectApiKeyDto]),
    __metadata("design:returntype", Promise)
], QuickConnectController.prototype, "getCredentialData", null);
exports.QuickConnectController = QuickConnectController = __decorate([
    (0, decorators_1.RestController)('/quick-connect'),
    __metadata("design:paramtypes", [quick_connect_service_1.QuickConnectService])
], QuickConnectController);
//# sourceMappingURL=quick-connect.controller.js.map