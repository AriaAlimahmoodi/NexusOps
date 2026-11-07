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
exports.RuntimeCredentialsContextHook = void 0;
const decorators_1 = require("@n8n/decorators");
const runtime_credentials_service_1 = require("./runtime-credentials.service");
let RuntimeCredentialsContextHook = class RuntimeCredentialsContextHook {
    constructor(runtimeCredentialsService) {
        this.runtimeCredentialsService = runtimeCredentialsService;
        this.hookDescription = {
            name: 'RuntimeCredentialsContextHook',
        };
    }
    isApplicableToTriggerNode(_nodeType) {
        return false;
    }
    async execute(options) {
        const { triggerItems, artifactsByAlias } = this.runtimeCredentialsService.strip(options.triggerItems ?? [], options.triggerNode.type);
        if (Object.keys(artifactsByAlias).length === 0)
            return { triggerItems };
        return {
            triggerItems,
            contextUpdate: {
                secureArtifacts: {
                    version: 1,
                    artifacts: artifactsByAlias,
                },
            },
        };
    }
};
exports.RuntimeCredentialsContextHook = RuntimeCredentialsContextHook;
exports.RuntimeCredentialsContextHook = RuntimeCredentialsContextHook = __decorate([
    (0, decorators_1.ContextEstablishmentHook)({
        alwaysExecute: true,
    }),
    __metadata("design:paramtypes", [runtime_credentials_service_1.RuntimeCredentialsService])
], RuntimeCredentialsContextHook);
//# sourceMappingURL=runtime-credentials-context-hook.js.map