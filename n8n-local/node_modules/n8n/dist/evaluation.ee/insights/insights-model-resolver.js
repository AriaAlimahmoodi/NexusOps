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
exports.InsightsModelResolver = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const credentials_service_1 = require("../../credentials/credentials.service");
const PROVIDER_PREFIX_BY_NODE_TYPE = new Map([
    ['@n8n/n8n-nodes-langchain.lmChatOpenAi', 'openai'],
    ['@n8n/n8n-nodes-langchain.lmChatAnthropic', 'anthropic'],
    ['@n8n/n8n-nodes-langchain.lmChatGoogleGemini', 'google'],
    ['@n8n/n8n-nodes-langchain.lmChatXAiGrok', 'xai'],
    ['@n8n/n8n-nodes-langchain.lmChatGroq', 'groq'],
    ['@n8n/n8n-nodes-langchain.lmChatDeepSeek', 'deepseek'],
    ['@n8n/n8n-nodes-langchain.lmChatCohere', 'cohere'],
    ['@n8n/n8n-nodes-langchain.lmChatMistralCloud', 'mistral'],
    ['@n8n/n8n-nodes-langchain.lmChatOpenRouter', 'openrouter'],
    ['@n8n/n8n-nodes-langchain.lmChatVercelAiGateway', 'vercel'],
]);
const SKIP_CREDENTIAL_BASE_URL = new Set(['google', 'cohere']);
let InsightsModelResolver = class InsightsModelResolver {
    constructor(evalConfigRepo, credentialsFinder, credentialsService) {
        this.evalConfigRepo = evalConfigRepo;
        this.credentialsFinder = credentialsFinder;
        this.credentialsService = credentialsService;
    }
    async resolve(user, workflowId, evaluationConfigId, preloadedConfig) {
        const config = preloadedConfig !== undefined
            ? preloadedConfig
            : await this.evalConfigRepo.findByIdAndWorkflowId(evaluationConfigId, workflowId);
        if (!config)
            return null;
        const judge = config.metrics.find((metric) => metric.type === 'llm_judge');
        if (!judge || judge.type !== 'llm_judge')
            return null;
        const prefix = PROVIDER_PREFIX_BY_NODE_TYPE.get(judge.config.provider);
        if (!prefix)
            return null;
        const credential = await this.credentialsFinder.findCredentialForUser(judge.config.credentialId, user, ['credential:read']);
        if (!credential)
            return null;
        const data = await this.credentialsService.decrypt(credential, true);
        const apiKey = typeof data.apiKey === 'string' ? data.apiKey : undefined;
        if (!apiKey)
            return null;
        const url = SKIP_CREDENTIAL_BASE_URL.has(prefix) || typeof data.url !== 'string' ? undefined : data.url;
        const modelId = `${prefix}/${judge.config.model}`;
        return { modelConfig: { id: modelId, apiKey, url }, modelId };
    }
};
exports.InsightsModelResolver = InsightsModelResolver;
exports.InsightsModelResolver = InsightsModelResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.EvaluationConfigRepository, backend_services_1.CredentialsFinderService, credentials_service_1.CredentialsService])
], InsightsModelResolver);
//# sourceMappingURL=insights-model-resolver.js.map