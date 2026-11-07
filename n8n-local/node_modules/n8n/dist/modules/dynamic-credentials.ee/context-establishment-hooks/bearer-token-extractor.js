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
exports.BearerTokenExtractor = void 0;
const decorators_1 = require("@n8n/decorators");
const http_header_extractor_1 = require("./http-header-extractor");
let BearerTokenExtractor = class BearerTokenExtractor {
    constructor(httpHeaderExtractor) {
        this.httpHeaderExtractor = httpHeaderExtractor;
        this.hookDescription = {
            name: 'BearerTokenExtractor',
            displayName: 'Bearer Token Extractor',
            options: [],
        };
    }
    isApplicableToTriggerNode(nodeType) {
        return this.httpHeaderExtractor.isApplicableToTriggerNode(nodeType);
    }
    async execute(options) {
        return await this.httpHeaderExtractor.execute({
            ...options,
            options: {
                headerName: 'authorization',
                headerValue: '[Bb][Ee][Aa][Rr][Ee][Rr]\\s+(.+)',
            },
        });
    }
};
exports.BearerTokenExtractor = BearerTokenExtractor;
exports.BearerTokenExtractor = BearerTokenExtractor = __decorate([
    (0, decorators_1.ContextEstablishmentHook)(),
    __metadata("design:paramtypes", [http_header_extractor_1.HttpHeaderExtractor])
], BearerTokenExtractor);
//# sourceMappingURL=bearer-token-extractor.js.map