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
exports.OAuth2MetadataHttpClient = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const identifier_interface_1 = require("./identifier-interface");
const backend_services_1 = require("@n8n/backend-services");
const REQUEST_TIMEOUT = 10 * constants_1.Time.seconds.toMilliseconds;
const METADATA_CACHE_TIMEOUT = 1 * constants_1.Time.hours.toMilliseconds;
let OAuth2MetadataHttpClient = class OAuth2MetadataHttpClient {
    constructor(logger, cache, outboundHttp) {
        this.logger = logger;
        this.cache = cache;
        this.http = outboundHttp.requests({
            timeout: REQUEST_TIMEOUT,
        });
    }
    async requestFull(options) {
        return await this.http.request({
            ...options,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        });
    }
    async fetchMetadata(schema, { metadataUri, cachePrefix, skipCache, forceRefresh = false }) {
        const cacheKey = `${cachePrefix}:metadata:${metadataUri}`;
        if (!skipCache && !forceRefresh) {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const response = await this.requestFull({
            url: metadataUri,
            method: 'GET',
            json: true,
        });
        if (response.statusCode !== 200) {
            this.logger.error(`Failed to fetch OAuth2 metadata from ${metadataUri}, status code: ${response.statusCode}`);
            throw new identifier_interface_1.IdentifierValidationError(`Failed to fetch OAuth2 metadata, status code: ${response.statusCode}`);
        }
        try {
            const metadata = schema.parse(response.body);
            if (!skipCache) {
                await this.cache.set(cacheKey, metadata, METADATA_CACHE_TIMEOUT);
            }
            return metadata;
        }
        catch (error) {
            this.logger.error('Invalid OAuth2 metadata format', { error });
            throw new identifier_interface_1.IdentifierValidationError('Invalid OAuth2 metadata format', { cause: error });
        }
    }
};
exports.OAuth2MetadataHttpClient = OAuth2MetadataHttpClient;
exports.OAuth2MetadataHttpClient = OAuth2MetadataHttpClient = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.CacheService, backend_network_1.OutboundHttp])
], OAuth2MetadataHttpClient);
//# sourceMappingURL=oauth2-metadata-http-client.js.map