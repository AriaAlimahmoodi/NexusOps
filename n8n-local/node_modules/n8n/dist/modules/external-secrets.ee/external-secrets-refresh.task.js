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
exports.ExternalSecretsRefreshTask = void 0;
const decorators_1 = require("@n8n/decorators");
const external_secrets_manager_ee_1 = require("./external-secrets-manager.ee");
const external_secrets_config_1 = require("./external-secrets.config");
let ExternalSecretsRefreshTask = class ExternalSecretsRefreshTask {
    constructor(config, manager) {
        this.manager = manager;
        this.name = 'external-secrets-refresh';
        this.target = (0, decorators_1.instanceTarget)(['main', 'worker', 'webhook']);
        this.schedule = (0, decorators_1.intervalFromSeconds)(config.updateInterval);
    }
    async run(signal) {
        await this.manager.updateSecrets(signal);
    }
};
exports.ExternalSecretsRefreshTask = ExternalSecretsRefreshTask;
exports.ExternalSecretsRefreshTask = ExternalSecretsRefreshTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [external_secrets_config_1.ExternalSecretsConfig, external_secrets_manager_ee_1.ExternalSecretsManager])
], ExternalSecretsRefreshTask);
//# sourceMappingURL=external-secrets-refresh.task.js.map