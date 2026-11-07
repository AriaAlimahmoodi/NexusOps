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
exports.RuntimeCredentialsConfig = void 0;
const config_1 = require("@n8n/config");
let RuntimeCredentialsConfig = class RuntimeCredentialsConfig {
    constructor() {
        this.sensitiveFieldRules = '{}';
    }
};
exports.RuntimeCredentialsConfig = RuntimeCredentialsConfig;
__decorate([
    (0, config_1.Env)('N8N_SECURITY_SENSITIVE_FIELD_RULES'),
    __metadata("design:type", String)
], RuntimeCredentialsConfig.prototype, "sensitiveFieldRules", void 0);
exports.RuntimeCredentialsConfig = RuntimeCredentialsConfig = __decorate([
    config_1.Config
], RuntimeCredentialsConfig);
//# sourceMappingURL=runtime-credentials.config.js.map