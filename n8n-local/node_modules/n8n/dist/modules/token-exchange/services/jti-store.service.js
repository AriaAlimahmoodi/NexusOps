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
exports.JtiStoreService = void 0;
const di_1 = require("@n8n/di");
const token_exchange_jti_repository_1 = require("../database/repositories/token-exchange-jti.repository");
const GRACE_PERIOD_MS = 60_000;
let JtiStoreService = class JtiStoreService {
    constructor(jtiRepository) {
        this.jtiRepository = jtiRepository;
    }
    async consume(jti, expiresAt) {
        const expiresAtWithGrace = new Date(expiresAt.getTime() + GRACE_PERIOD_MS);
        return await this.jtiRepository.atomicConsume(jti, expiresAtWithGrace);
    }
};
exports.JtiStoreService = JtiStoreService;
exports.JtiStoreService = JtiStoreService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [token_exchange_jti_repository_1.TokenExchangeJtiRepository])
], JtiStoreService);
//# sourceMappingURL=jti-store.service.js.map