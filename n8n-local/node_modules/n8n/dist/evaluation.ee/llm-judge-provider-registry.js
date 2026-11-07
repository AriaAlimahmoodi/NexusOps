"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmJudgeProviderRegistry = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const PROVIDERS_BY_NODE_TYPE = new Map(api_types_1.LLM_JUDGE_PROVIDERS.map((p) => [p.nodeType, p]));
const PROVIDERS_BY_CREDENTIAL_TYPE = new Map(api_types_1.LLM_JUDGE_PROVIDERS.flatMap((p) => p.credentialTypes.map((c) => [c.name, p])));
let LlmJudgeProviderRegistry = class LlmJudgeProviderRegistry {
    listProviders() {
        return api_types_1.LLM_JUDGE_PROVIDERS;
    }
    get(nodeType) {
        return PROVIDERS_BY_NODE_TYPE.get(nodeType);
    }
    getByCredentialType(credentialType) {
        return PROVIDERS_BY_CREDENTIAL_TYPE.get(credentialType);
    }
};
exports.LlmJudgeProviderRegistry = LlmJudgeProviderRegistry;
exports.LlmJudgeProviderRegistry = LlmJudgeProviderRegistry = __decorate([
    (0, di_1.Service)()
], LlmJudgeProviderRegistry);
//# sourceMappingURL=llm-judge-provider-registry.js.map