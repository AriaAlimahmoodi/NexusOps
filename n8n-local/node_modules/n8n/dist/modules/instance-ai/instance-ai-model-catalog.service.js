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
exports.InstanceAiModelCatalogService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const CATALOG_CACHE_TTL_MS = 60 * 60 * 1000;
const CATALOG_FETCH_TIMEOUT_MS = 5000;
function emptyCatalogResponse() {
    return {
        models: {
            anthropic: [],
            openai: [],
            openrouter: [],
        },
    };
}
function compareModels(a, b) {
    const aReleaseTime = a.releaseDate ? Date.parse(a.releaseDate) : Number.NaN;
    const bReleaseTime = b.releaseDate ? Date.parse(b.releaseDate) : Number.NaN;
    const aHasReleaseDate = !Number.isNaN(aReleaseTime);
    const bHasReleaseDate = !Number.isNaN(bReleaseTime);
    if (aHasReleaseDate && bHasReleaseDate && aReleaseTime !== bReleaseTime) {
        return bReleaseTime - aReleaseTime;
    }
    if (aHasReleaseDate !== bHasReleaseDate)
        return aHasReleaseDate ? -1 : 1;
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}
function isEligibleModel(model) {
    const id = typeof model === 'object' && model !== null ? Reflect.get(model, 'id') : undefined;
    const name = typeof model === 'object' && model !== null ? Reflect.get(model, 'name') : undefined;
    const modalities = typeof model === 'object' && model !== null ? Reflect.get(model, 'modalities') : undefined;
    const output = typeof modalities === 'object' && modalities !== null
        ? Reflect.get(modalities, 'output')
        : undefined;
    return (typeof model === 'object' &&
        model !== null &&
        Reflect.get(model, 'toolCall') === true &&
        Array.isArray(output) &&
        output.length === 1 &&
        output[0] === 'text' &&
        typeof id === 'string' &&
        id.length > 0 &&
        typeof name === 'string' &&
        name.length > 0);
}
let InstanceAiModelCatalogService = class InstanceAiModelCatalogService {
    constructor(logger) {
        this.logger = logger.scoped('instance-ai');
    }
    async getModels() {
        if (this.cached && Date.now() < this.cached.expiresAt)
            return this.cached.value;
        this.fetchPromise ??= this.refresh().finally(() => {
            this.fetchPromise = undefined;
        });
        return await this.fetchPromise;
    }
    async refresh() {
        try {
            const catalog = await this.fetchCatalogWithTimeout();
            const value = this.toResponse(catalog);
            this.cached = { value, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS };
            return value;
        }
        catch (error) {
            this.logger.warn('Failed to load the Instance AI model catalog', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
            return this.cached?.value ?? emptyCatalogResponse();
        }
    }
    async fetchCatalogWithTimeout() {
        const abortController = new AbortController();
        let timeout;
        const timeoutPromise = new Promise((_resolve, reject) => {
            timeout = setTimeout(() => {
                reject(new Error('Model catalog request timed out'));
                abortController.abort();
            }, CATALOG_FETCH_TIMEOUT_MS);
        });
        const catalogPromise = this.fetchCatalog(abortController.signal);
        void catalogPromise.catch(() => undefined);
        try {
            return await Promise.race([catalogPromise, timeoutPromise]);
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }
    async fetchCatalog(signal) {
        const { fetchProviderCatalog } = await import('@n8n/agents/catalog');
        return await fetchProviderCatalog({ signal });
    }
    toResponse(catalog) {
        const response = emptyCatalogResponse();
        for (const provider of api_types_1.INSTANCE_AI_CATALOG_PROVIDERS) {
            response.models[provider] = this.getProviderModels(catalog, provider);
        }
        return response;
    }
    getProviderModels(catalog, provider) {
        return Object.values(catalog[provider]?.models ?? {})
            .filter(isEligibleModel)
            .map((model) => ({
            id: model.id,
            name: model.name,
            ...(typeof model.releaseDate === 'string' ? { releaseDate: model.releaseDate } : {}),
        }))
            .sort(compareModels);
    }
};
exports.InstanceAiModelCatalogService = InstanceAiModelCatalogService;
exports.InstanceAiModelCatalogService = InstanceAiModelCatalogService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], InstanceAiModelCatalogService);
//# sourceMappingURL=instance-ai-model-catalog.service.js.map