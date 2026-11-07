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
exports.EngineCredentialsController = void 0;
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const engine_credentials_contract_1 = require("./engine-credentials.contract");
const engine_credentials_service_1 = require("./engine-credentials.service");
let EngineCredentialsController = class EngineCredentialsController {
    constructor(credentialsService) {
        this.credentialsService = credentialsService;
    }
    async resolveCredential(req, res) {
        const parsed = engine_credentials_contract_1.resolveCredentialRequestSchema.safeParse(req.body);
        if (!parsed.success)
            throw new errors_1.BadRequestError('Invalid credential resolve request');
        const data = await this.credentialsService.resolve(parsed.data);
        const body = { data };
        res.status(200).json(body);
    }
};
exports.EngineCredentialsController = EngineCredentialsController;
exports.EngineCredentialsController = EngineCredentialsController = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_credentials_service_1.EngineCredentialsService])
], EngineCredentialsController);
//# sourceMappingURL=engine-credentials.controller.js.map