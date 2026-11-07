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
exports.AuthorizeIntentService = void 0;
const di_1 = require("@n8n/di");
const node_crypto_1 = require("node:crypto");
const types_1 = require("../../../oauth/types");
const backend_services_1 = require("@n8n/backend-services");
const CACHE_PREFIX = 'dynamic-credentials:authorize-intent:';
let AuthorizeIntentService = class AuthorizeIntentService {
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    async create(intent) {
        const token = (0, node_crypto_1.randomBytes)(32).toString('base64url');
        await this.cacheService.set(this.cacheKey(token), intent, types_1.MAX_CSRF_AGE);
        return token;
    }
    async get(token) {
        return await this.cacheService.get(this.cacheKey(token));
    }
    cacheKey(token) {
        return `${CACHE_PREFIX}${token}`;
    }
};
exports.AuthorizeIntentService = AuthorizeIntentService;
exports.AuthorizeIntentService = AuthorizeIntentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CacheService])
], AuthorizeIntentService);
//# sourceMappingURL=authorize-intent.service.js.map