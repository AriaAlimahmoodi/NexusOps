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
exports.RuntimeCredentialsAccessService = void 0;
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
let RuntimeCredentialsAccessService = class RuntimeCredentialsAccessService {
    constructor(cipher) {
        this.cipher = cipher;
    }
    async getRuntimeCredential(runExecutionData, alias) {
        const secureArtifacts = runExecutionData.executionData?.runtimeData?.secureArtifacts;
        if (typeof secureArtifacts === 'string') {
            const decryptedSecureArtifacts = await this.cipher.decryptV2(secureArtifacts);
            const parsedSecureArtifacts = (0, n8n_workflow_1.toSecureArtifacts)(decryptedSecureArtifacts);
            return parsedSecureArtifacts.artifacts[alias];
        }
        return undefined;
    }
};
exports.RuntimeCredentialsAccessService = RuntimeCredentialsAccessService;
exports.RuntimeCredentialsAccessService = RuntimeCredentialsAccessService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.Cipher])
], RuntimeCredentialsAccessService);
//# sourceMappingURL=runtime-credentials-access.service.js.map